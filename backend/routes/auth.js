const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Candidate = require('../models/Candidate');
const Invitation = require('../models/Invitation');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Admin login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { role: 'admin', email: email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, message: 'Admin login successful' });
});

// Candidate uses invitation token
router.post('/candidate/verify-invitation', async (req, res) => {
  try {
    const { token, email } = req.body;

    const invitation = await Invitation.findOne({
      token: token,
      email: email.toLowerCase(),
      used: false,
      expiryDate: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // Mark invitation as used
    invitation.used = true;
    invitation.usedAt = new Date();
    await invitation.save();

    // Create or update candidate
    let candidate = await Candidate.findOne({ email: email.toLowerCase() });
    if (!candidate) {
      candidate = new Candidate({
        email: email.toLowerCase(),
        name: invitation.name,
        position: invitation.position
      });
    }
    candidate.testStarted = false;
    candidate.testCompleted = false;
    await candidate.save();

    // Generate test token
    const testToken = jwt.sign(
      { candidateId: candidate._id, email: candidate.email, role: 'candidate' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      testToken, 
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        position: candidate.position
      },
      message: 'Invitation verified. You can now start the test.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate new token for test
router.post('/candidate/start-test', async (req, res) => {
  try {
    const { email } = req.body;
    
    const candidate = await Candidate.findOne({ email: email.toLowerCase() });
    if (!candidate) {
      return res.status(400).json({ error: 'Candidate not found' });
    }

    if (candidate.testCompleted) {
      return res.status(400).json({ error: 'Test already completed. Cannot restart.' });
    }

    candidate.testStarted = true;
    candidate.testStartTime = new Date();
    await candidate.save();

    const testToken = jwt.sign(
      { candidateId: candidate._id, email: candidate.email, role: 'candidate' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ testToken, startTime: candidate.testStartTime });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
