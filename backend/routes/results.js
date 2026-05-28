const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const nodemailer = require('nodemailer');

const iqTestQuestions = [
  { id: 1, correctAnswer: "22112112", marks: 1 },
  { id: 2, correctAnswer: "STEEL", marks: 1 },
  { id: 3, correctAnswer: "29", marks: 1 },
  { id: 4, correctAnswer: "BIOGRAPHY", marks: 1 },
  { id: 5, correctAnswer: "ARM", marks: 1 },
  { id: 6, correctAnswer: "TRUE", marks: 1 },
  { id: 7, correctAnswer: "11", marks: 1 },
  { id: 8, correctAnswer: "It is impossible to tell whether Sam or Mark is older", marks: 1 },
  { id: 9, correctAnswer: "6283", marks: 1 },
  { id: 10, correctAnswer: "NICKELS", marks: 1 },
  { id: 11, correctAnswer: "OUNCE", marks: 1 },
  { id: 12, correctAnswer: "ATTACK", marks: 1 },
  { id: 13, correctAnswer: "COWARDICE", marks: 1 },
  { id: 14, correctAnswer: "100%", marks: 1 },
  { id: 15, correctAnswer: "CORN", marks: 1 },
  { id: 16, correctAnswer: "BOOK", marks: 1 },
  { id: 17, correctAnswer: "6", marks: 1 },
  { id: 18, correctAnswer: "TRUE", marks: 1 },
  { id: 19, correctAnswer: "73", marks: 1 },
  { id: 20, correctAnswer: "EAT", marks: 1 },
  { id: 21, correctAnswer: "UNCLE", marks: 1 },
  { id: 22, correctAnswer: "FISH", marks: 1 },
  { id: 23, correctAnswer: "CHICKEN", marks: 1 },
  { id: 24, correctAnswer: "VLOPPED", marks: 1 },
  { id: 25, correctAnswer: "72 inches", marks: 1 },
  { id: 26, correctAnswer: "CITY", marks: 1 },
  { id: 27, correctAnswer: "20", marks: 1 },
  { id: 28, correctAnswer: "ZITFUL", marks: 1 },
  { id: 29, correctAnswer: "OCEAN", marks: 1 },
  { id: 30, correctAnswer: "12", marks: 1 },
  { id: 31, correctAnswer: "BODY", marks: 1 },
  { id: 32, correctAnswer: "DALLAS", marks: 1 },
  { id: 33, correctAnswer: "NEITHER", marks: 1 },
  { id: 34, correctAnswer: "CHECK", marks: 1 },
  { id: 35, correctAnswer: "M", marks: 1 },
  { id: 36, correctAnswer: "SLEEVE", marks: 1 },
  { id: 37, correctAnswer: "NEITHER", marks: 1 },
  { id: 38, correctAnswer: "CITY", marks: 1 },
  { id: 39, correctAnswer: "GOLFER", marks: 1 },
  { id: 40, correctAnswer: "CEMENT", marks: 1 }
];

const verifyCandidateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'candidate') return res.status(403).json({ error: 'Unauthorized' });
    req.candidate = decoded;
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

const getScoreLabel = (pct) => {
  if (pct >= 75) return 'Excellent';
  if (pct >= 50) return 'Good';
  if (pct >= 25) return 'Average';
  return 'Below Average';
};

const sendCompletionEmails = async (candidate, totalMarks, percentage, timeTaken, suspiciousCount) => {
  try {
    const hexaUsers = await prisma.hexaUser.findMany({ where: { active: true }, select: { email: true } });
    const recipients = [process.env.ADMIN_EMAIL, ...hexaUsers.map(u => u.email)].filter(Boolean);

    const minutes = Math.floor((timeTaken || 0) / 60);
    const seconds = (timeTaken || 0) % 60;
    const timeStr = `${minutes}m ${seconds}s`;
    const scoreColor = percentage >= 75 ? '#28a745' : percentage >= 50 ? '#f0ad00' : '#dc3545';
    const dashboardLink = `${process.env.FRONTEND_URL}/admin`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 30px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:1.5rem">Hexa IQ Test — Completion Alert</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px">
          <p style="color:#555;margin-top:0">A candidate has completed the IQ test. Here is the summary:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-weight:600;color:#333;width:40%">Candidate</td>
              <td style="padding:10px 14px;color:#555">${candidate.name}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#333">Email</td>
              <td style="padding:10px 14px;color:#555">${candidate.email}</td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-weight:600;color:#333">Position</td>
              <td style="padding:10px 14px;color:#555">${candidate.position}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#333">Score</td>
              <td style="padding:10px 14px"><strong style="color:${scoreColor}">${totalMarks}/40 (${Math.round(percentage)}%) — ${getScoreLabel(percentage)}</strong></td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-weight:600;color:#333">Time Taken</td>
              <td style="padding:10px 14px;color:#555">${timeStr}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#333">Suspicious Flags</td>
              <td style="padding:10px 14px;color:${suspiciousCount > 0 ? '#dc3545' : '#28a745'}">${suspiciousCount > 0 ? `⚠️ ${suspiciousCount} flag(s) detected` : '✓ Clean'}</td>
            </tr>
          </table>
          <p style="text-align:center;margin:28px 0">
            <a href="${dashboardLink}" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold">View Full Results in Dashboard</a>
          </p>
          <p style="color:#999;font-size:0.85rem;margin:0">This is an automated notification from the Hexa IQ Test Platform.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipients.join(', '),
      subject: `IQ Test Completed — ${candidate.name} (${Math.round(percentage)}%)`,
      html
    });
  } catch (err) {
    console.error('Completion email error:', err.message);
  }
};

router.post('/submit', verifyCandidateToken, async (req, res) => {
  try {
    const { answers, timeTaken, browserFingerprint, suspiciousActivities } = req.body;

    const candidate = await prisma.candidate.findUnique({ where: { id: req.candidate.candidateId } });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (candidate.testCompleted) return res.status(400).json({ error: 'Test already submitted' });

    let totalMarks = 0;
    const processedAnswers = answers.map(answer => {
      const question = iqTestQuestions.find(q => q.id === answer.questionId);
      const isCorrect = question && question.correctAnswer === answer.selectedAnswer;
      const marks = isCorrect ? question.marks : 0;
      totalMarks += marks;
      return {
        questionId: answer.questionId,
        questionText: answer.questionText || '',
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question ? question.correctAnswer : '',
        isCorrect,
        marks
      };
    });

    const percentage = (totalMarks / 40) * 100;
    const suspiciousCount = Array.isArray(suspiciousActivities) ? suspiciousActivities.length : 0;

    const testResult = await prisma.testResult.create({
      data: {
        candidateId: candidate.id,
        email: candidate.email,
        answers: processedAnswers,
        totalMarks,
        percentage,
        timeTaken,
        browserFingerprint,
        suspiciousActivities: suspiciousActivities || []
      }
    });

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { testCompleted: true, testEndTime: new Date() }
    });

    // Send completion notification (non-blocking)
    sendCompletionEmails(candidate, totalMarks, percentage, timeTaken, suspiciousCount);

    res.json({
      success: true,
      message: 'Test submitted successfully',
      resultId: testResult.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-result', verifyCandidateToken, async (req, res) => {
  try {
    const testResult = await prisma.testResult.findUnique({
      where: { candidateId: req.candidate.candidateId }
    });
    if (!testResult) return res.status(404).json({ error: 'Result not found' });
    res.json({ submitted: true, submittedAt: testResult.submittedAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
