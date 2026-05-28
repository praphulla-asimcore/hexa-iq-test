const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.hexaUser.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.active || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials or account not activated' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await prisma.hexaUser.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const token = jwt.sign(
      { role: 'hexauser', userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set password via setup token
router.post('/setup-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;

    const user = await prisma.hexaUser.findFirst({
      where: {
        email: email.toLowerCase(),
        setupToken: token,
        setupExpiry: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired setup link' });

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.hexaUser.update({
      where: { id: user.id },
      data: { passwordHash, active: true, setupToken: null, setupExpiry: null }
    });

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify setup token (for frontend to validate before showing form)
router.get('/verify-setup', async (req, res) => {
  try {
    const { token, email } = req.query;
    const user = await prisma.hexaUser.findFirst({
      where: {
        email: email?.toLowerCase(),
        setupToken: token,
        setupExpiry: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired setup link' });
    res.json({ valid: true, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
