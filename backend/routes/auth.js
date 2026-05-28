const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Admin login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { role: 'admin', email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, message: 'Admin login successful' });
});

// Candidate uses invitation token
router.post('/candidate/verify-invitation', async (req, res) => {
  try {
    const { token, email } = req.body;

    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        email: email.toLowerCase(),
        used: false,
        expiryDate: { gt: new Date() }
      }
    });

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { used: true, usedAt: new Date() }
    });

    const candidate = await prisma.candidate.upsert({
      where: { email: email.toLowerCase() },
      update: { testStarted: false, testCompleted: false },
      create: {
        email: email.toLowerCase(),
        name: invitation.name || '',
        position: invitation.position || ''
      }
    });

    const testToken = jwt.sign(
      { candidateId: candidate.id, email: candidate.email, role: 'candidate' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      testToken,
      candidate: {
        id: candidate.id,
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

// Validate candidate by email and issue JWT (no timer start)
router.post('/candidate/start-test', async (req, res) => {
  try {
    const { email } = req.body;

    const candidate = await prisma.candidate.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!candidate) {
      return res.status(400).json({ error: 'Candidate not found' });
    }

    if (candidate.testCompleted) {
      return res.status(400).json({ error: 'Test already completed. Cannot restart.' });
    }

    const testToken = jwt.sign(
      { candidateId: candidate.id, email: candidate.email, role: 'candidate' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ testToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save demographics collected before the test
router.post('/candidate/save-demographics', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'candidate') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, address, nationality, gender } = req.body;

    await prisma.candidate.update({
      where: { id: decoded.candidateId },
      data: { name, address, nationality, gender }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Begin the test — records testStartTime, called from Guidelines page
router.post('/candidate/begin-test', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'candidate') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.candidate.update({
      where: { id: decoded.candidateId },
      data: { testStarted: true, testStartTime: new Date() }
    });

    const testToken = jwt.sign(
      { candidateId: updated.id, email: updated.email, role: 'candidate' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ testToken, startTime: updated.testStartTime });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
