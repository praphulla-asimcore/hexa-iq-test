const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Invitation = require('../models/Invitation');
const nodemailer = require('nodemailer');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Send invitation email
router.post('/send-invitation', verifyAdminToken, async (req, res) => {
  try {
    const { email, name, position } = req.body;

    if (!email || !name || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if invitation already exists
    let invitation = await Invitation.findOne({ email: email.toLowerCase() });
    
    const token = uuidv4();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Valid for 7 days

    if (invitation) {
      invitation.token = token;
      invitation.expiryDate = expiryDate;
      invitation.used = false;
      await invitation.save();
    } else {
      invitation = new Invitation({
        email: email.toLowerCase(),
        name,
        position,
        token,
        expiryDate
      });
      await invitation.save();
    }

    // Send email
    const invitationLink = `${process.env.FRONTEND_URL}/test?token=${token}&email=${email}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Hexa IQ Test Invitation',
      html: `
        <h2>IQ Test Invitation</h2>
        <p>Dear ${name},</p>
        <p>You have been invited to take the Hexa IQ Test for the position of <strong>${position}</strong>.</p>
        <p><strong>Time Limit: 45 minutes</strong></p>
        <p>Click the link below to start the test:</p>
        <p><a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start IQ Test</a></p>
        <p>This invitation will expire in 7 days.</p>
        <p>Best regards,<br>Hexa Matics Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'Invitation sent successfully',
      email: email,
      expiresIn: '7 days'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all invitations
router.get('/invitations', verifyAdminToken, async (req, res) => {
  try {
    const invitations = await Invitation.find().sort({ createdAt: -1 });
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend invitation
router.post('/resend-invitation/:email', verifyAdminToken, async (req, res) => {
  try {
    const { email } = req.params;
    const invitation = await Invitation.findOne({ email: email.toLowerCase() });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitationLink = `${process.env.FRONTEND_URL}/test?token=${invitation.token}&email=${email}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Hexa IQ Test Invitation - Resend',
      html: `
        <h2>IQ Test Invitation</h2>
        <p>Dear ${invitation.name},</p>
        <p>Here is your IQ test invitation for the position of <strong>${invitation.position}</strong>.</p>
        <p><strong>Time Limit: 45 minutes</strong></p>
        <p><a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start IQ Test</a></p>
        <p>Best regards,<br>Hexa Matics Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Invitation resent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
