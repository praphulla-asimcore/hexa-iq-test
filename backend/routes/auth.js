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

// Generate new token for test
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

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
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
