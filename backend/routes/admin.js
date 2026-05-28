const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const nodemailer = require('nodemailer');

const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Allows both admin and hexauser roles (read + candidate invite access)
const verifyStaffToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'hexauser') return res.status(403).json({ error: 'Unauthorized' });
    req.staff = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// ─── Candidate invitations ────────────────────────────────────────────────

router.post('/send-invitation', verifyStaffToken, async (req, res) => {
  try {
    const { email, name, position } = req.body;
    if (!email || !name || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = uuidv4();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    await prisma.invitation.upsert({
      where: { email: email.toLowerCase() },
      update: { token, expiryDate, used: false, name, position },
      create: { email: email.toLowerCase(), name, position, token, expiryDate }
    });

    const invitationLink = `${process.env.FRONTEND_URL}/test?token=${token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Hexa IQ Test Invitation',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0;font-size:1.8rem">Hexa IQ Test</h1>
          </div>
          <div style="background:#fff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px">
            <h2 style="color:#333">Test Invitation</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>You have been invited to take the Hexa IQ Test for the position of <strong>${position}</strong>.</p>
            <p><strong>Time Limit: 45 minutes &nbsp;|&nbsp; 40 Questions</strong></p>
            <p style="margin:30px 0;text-align:center">
              <a href="${invitationLink}" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:1rem">Start IQ Test</a>
            </p>
            <p style="color:#999;font-size:0.9rem">This invitation expires in 7 days. Do not share this link.</p>
            <p>Best regards,<br><strong>Hexa Matics Team</strong></p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Invitation sent successfully', email, expiresIn: '7 days' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/invitations', verifyStaffToken, async (req, res) => {
  try {
    const invitations = await prisma.invitation.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/resend-invitation/:email', verifyStaffToken, async (req, res) => {
  try {
    const { email } = req.params;
    const invitation = await prisma.invitation.findUnique({ where: { email: email.toLowerCase() } });
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

    const invitationLink = `${process.env.FRONTEND_URL}/test?token=${invitation.token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Hexa IQ Test Invitation – Reminder',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0">Hexa IQ Test</h1>
          </div>
          <div style="background:#fff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px">
            <p>Dear <strong>${invitation.name}</strong>,</p>
            <p>This is a reminder for your IQ test invitation for the position of <strong>${invitation.position}</strong>.</p>
            <p style="margin:30px 0;text-align:center">
              <a href="${invitationLink}" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold">Start IQ Test</a>
            </p>
            <p>Best regards,<br><strong>Hexa Matics Team</strong></p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Invitation resent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Results ──────────────────────────────────────────────────────────────

router.get('/results', verifyStaffToken, async (req, res) => {
  try {
    const results = await prisma.testResult.findMany({
      include: { candidate: { select: { name: true, position: true } } },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics', verifyStaffToken, async (req, res) => {
  try {
    const [totalResults, totalInvitations, totalCandidates, results] = await Promise.all([
      prisma.testResult.count(),
      prisma.invitation.count(),
      prisma.candidate.count(),
      prisma.testResult.findMany({
        include: { candidate: { select: { name: true, position: true } } },
        orderBy: { totalMarks: 'desc' }
      })
    ]);

    const avgScore = results.length > 0
      ? Math.round((results.reduce((s, r) => s + r.totalMarks, 0) / results.length) * 10) / 10
      : 0;
    const avgPercentage = results.length > 0
      ? Math.round((results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length) * 10) / 10
      : 0;

    const topScorers = results.slice(0, 10).map(r => ({
      name: r.candidate.name,
      email: r.email,
      position: r.candidate.position,
      totalMarks: r.totalMarks,
      percentage: r.percentage
    }));

    const distribution = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
    results.forEach(r => {
      const p = r.percentage || 0;
      if (p <= 25) distribution['0-25']++;
      else if (p <= 50) distribution['26-50']++;
      else if (p <= 75) distribution['51-75']++;
      else distribution['76-100']++;
    });

    res.json({ totalResults, totalInvitations, totalCandidates, avgScore, avgPercentage, topScorers, distribution });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── HexaUser management ──────────────────────────────────────────────────

router.post('/invite-hexauser', verifyAdminToken, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });

    const setupToken = uuidv4();
    const setupExpiry = new Date();
    setupExpiry.setDate(setupExpiry.getDate() + 7);

    const existing = await prisma.hexaUser.findUnique({ where: { email: email.toLowerCase() } });

    let user;
    if (existing) {
      user = await prisma.hexaUser.update({
        where: { email: email.toLowerCase() },
        data: { name, setupToken, setupExpiry, active: false, passwordHash: null }
      });
    } else {
      user = await prisma.hexaUser.create({
        data: { email: email.toLowerCase(), name, setupToken, setupExpiry, invitedBy: req.admin.email }
      });
    }

    const setupLink = `${process.env.FRONTEND_URL}/hexauser/setup?token=${setupToken}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Hexa IQ Platform – Your Account Invitation',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0">Hexa Matics</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0">IQ Test Platform</p>
          </div>
          <div style="background:#fff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px">
            <h2 style="color:#333">Welcome, ${name}!</h2>
            <p>You have been invited by the admin to access the <strong>Hexa IQ Test Platform</strong>.</p>
            <p>As a Hexamatics user, you can:</p>
            <ul style="color:#555;line-height:2">
              <li>View all candidate results and answer breakdowns</li>
              <li>Invite candidates for the IQ test</li>
            </ul>
            <p>Click below to set up your password and activate your account:</p>
            <p style="margin:30px 0;text-align:center">
              <a href="${setupLink}" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:1rem">Activate My Account</a>
            </p>
            <p style="color:#999;font-size:0.85rem">This link expires in 7 days.</p>
            <p>Best regards,<br><strong>Hexa Matics Admin</strong></p>
          </div>
        </div>
      `
    });

    res.json({ message: `Invitation sent to ${email}`, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hexausers', verifyAdminToken, async (req, res) => {
  try {
    const users = await prisma.hexaUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, active: true, createdAt: true, lastLogin: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/hexausers/:id', verifyAdminToken, async (req, res) => {
  try {
    await prisma.hexaUser.delete({ where: { id: req.params.id } });
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
