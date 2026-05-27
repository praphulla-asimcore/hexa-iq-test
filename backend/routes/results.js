const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const TestResult = require('../models/TestResult');
const Candidate = require('../models/Candidate');

// IQ Test Questions - Duplicated here for results processing
const iqTestQuestions = [
  { id: 1, question: "YYZZZYZZY is to 221112112 as YYZZYZZY is to:", correctAnswer: "22112112", marks: 1 },
  { id: 2, question: "Which of the five is least like the other four?", correctAnswer: "STEEL", marks: 1 },
  { id: 3, question: "Jerry received both the 15th highest and the 15th lowest mark in the class. How many students are in the class?", correctAnswer: "29", marks: 1 },
  { id: 4, question: "Which of the five is least like the other four?", correctAnswer: "BIOGRAPHY", marks: 1 },
  { id: 5, question: "Foot is to hand as leg is to:", correctAnswer: "ARM", marks: 1 },
  { id: 6, question: "If all Ferpies are Worgs and no Worgs are Sprickles, then no Sprickles are definitely Ferpies.", correctAnswer: "TRUE", marks: 1 },
  { id: 7, question: "Of the following numbers, which one is least like the others?", correctAnswer: "11", marks: 1 },
  { id: 8, question: "Terry is older than Mark and Sam is younger than Terry. Which of the following statements is most accurate?", correctAnswer: "It is impossible to tell whether Sam or Mark is older", marks: 1 },
  { id: 9, question: "Leap is to peal as 8326 is to:", correctAnswer: "6283", marks: 1 },
  { id: 10, question: "Anne received $0.59 in change from a supermarket purchase. Of the eleven coins she received in change, three were exactly alike. These three coins had to be:", correctAnswer: "NICKELS", marks: 1 },
  { id: 11, question: "Which of the five is least like the other four?", correctAnswer: "OUNCE", marks: 1 },
  { id: 12, question: "Three enemy messages were intercepted. 'Berok tenlis krux' means 'Secret attack Wednesday' and 'Baroom zax tenlis' means 'Secret plans included' and 'Gradnor berok plil elan' means 'Wednesday victory is ours.' What does 'krux' mean?", correctAnswer: "ATTACK", marks: 1 },
  { id: 13, question: "Love is to hate as valor is to:", correctAnswer: "COWARDICE", marks: 1 },
  { id: 14, question: "The price of an article was cut 50% for a sale. By what percent must the price of the item be increased to again sell the item at the original price?", correctAnswer: "100%", marks: 1 },
  { id: 15, question: "Which of the five is least like the other four?", correctAnswer: "CORN", marks: 1 },
  { id: 16, question: "Hole is to donut as pages are to:", correctAnswer: "BOOK", marks: 1 },
  { id: 17, question: "Kim was sent to the store to get 11 large cans of fruit. Kim could carry only 2 cans at a time. How many trips to the store did Kim have to make?", correctAnswer: "6", marks: 1 },
  { id: 18, question: "If all Pleeps are Floops and all Floops are Leepies, then all Pleeps are definitely Leepies.", correctAnswer: "TRUE", marks: 1 },
  { id: 19, question: "Jim, John, Jerry, and Joe together bought a basket of 144 apples. Jim received 10 more apples than John, 26 more than Jerry, and 32 more than Joe. How many apples did Jim receive?", correctAnswer: "73", marks: 1 },
  { id: 20, question: "Which of the five is least like the other four?", correctAnswer: "EAT", marks: 1 },
  { id: 21, question: "Daughter is to father as niece is to:", correctAnswer: "UNCLE", marks: 1 },
  { id: 22, question: "Bark is to tree as scales are to:", correctAnswer: "FISH", marks: 1 },
  { id: 23, question: "Which of the five is least like the other four?", correctAnswer: "CHICKEN", marks: 1 },
  { id: 24, question: "The secher vlooped quaply berak the kriggly lool. Then the secher ______ flaxly down the kleek. Which word belongs in the space?", correctAnswer: "VLOPPED", marks: 1 },
  { id: 25, question: "The fish has a head 9 inches long. The tail is equal to the size of the head plus one-half the size of the body. The body is the size of the head plus the tail. How long is the fish?", correctAnswer: "72 inches", marks: 1 },
  { id: 26, question: "If you rearrange the letters in 'NAICH,' you would have the name of a(n):", correctAnswer: "CITY", marks: 1 },
  { id: 27, question: "Jack is 15 years old, three times as old as his sister. How old will Jack be when he is twice as old as his sister?", correctAnswer: "20", marks: 1 },
  { id: 28, question: "Siok are more zitful than mulk, but pringling flex are most____of all. Which word belongs in the blank space?", correctAnswer: "ZITFUL", marks: 1 },
  { id: 29, question: "If you rearrange the letters in 'SHORE,' you would have the name of a(n):", correctAnswer: "OCEAN", marks: 1 },
  { id: 30, question: "Which number does not belong in the following series? 1, 3, 5, 7, 9, 11, 12, 13, 15", correctAnswer: "12", marks: 1 },
  { id: 31, question: "Gas is to car as food is to:", correctAnswer: "BODY", marks: 1 },
  { id: 32, question: "Which of the five is least like the other four?", correctAnswer: "DALLAS", marks: 1 },
  { id: 33, question: "If some Tripples are Tropples and all Bolars are Tropples, then some Tripples are definitely Bolars.", correctAnswer: "NEITHER", marks: 1 },
  { id: 34, question: "Light is to moon as book is to:", correctAnswer: "CHECK", marks: 1 },
  { id: 35, question: "Which letter does not belong in the following series? B, E, H, K, M, N, Q, T", correctAnswer: "M", marks: 1 },
  { id: 36, question: "Pillow is to pillowcase as arm is to:", correctAnswer: "SLEEVE", marks: 1 },
  { id: 37, question: "If all Truples are Glogs and some Glogs are Glips, then some Truples are definitely Glips.", correctAnswer: "NEITHER", marks: 1 },
  { id: 38, question: "If you rearrange the letters in 'TALCATIN,' you would have the name of a(n):", correctAnswer: "CITY", marks: 1 },
  { id: 39, question: "Which of the five is least like the other four?", correctAnswer: "GOLFER", marks: 1 },
  { id: 40, question: "Which of the five is least like the other four?", correctAnswer: "CEMENT", marks: 1 }
];

// Middleware to verify candidate token
const verifyCandidateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'candidate') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    req.candidate = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Submit test results
router.post('/submit', verifyCandidateToken, async (req, res) => {
  try {
    const { answers, timeTaken, browserFingerprint, suspiciousActivities } = req.body;

    const candidate = await Candidate.findById(req.candidate.candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.testCompleted) {
      return res.status(400).json({ error: 'Test already submitted' });
    }

    // Calculate marks
    let totalMarks = 0;
    const processedAnswers = answers.map(answer => {
      const question = iqTestQuestions.find(q => q.id === answer.questionId);
      const isCorrect = question && question.correctAnswer === answer.selectedAnswer;
      const marks = isCorrect ? question.marks : 0;
      totalMarks += marks;

      return {
        questionId: answer.questionId,
        questionText: question?.question || '',
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        marks
      };
    });

    // Create result record
    const testResult = new TestResult({
      candidateId: candidate._id,
      email: candidate.email,
      answers: processedAnswers,
      totalMarks,
      percentage: (totalMarks / 60) * 100,
      timeTaken,
      browserFingerprint,
      suspiciousActivities
    });

    await testResult.save();

    // Mark candidate as completed
    candidate.testCompleted = true;
    candidate.testEndTime = new Date();
    await candidate.save();

    res.json({
      success: true,
      message: 'Test submitted successfully',
      totalMarks,
      percentage: testResult.percentage,
      resultId: testResult._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get candidate's result (after submission)
router.get('/my-result', verifyCandidateToken, async (req, res) => {
  try {
    const testResult = await TestResult.findOne({
      candidateId: req.candidate.candidateId
    });

    if (!testResult) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({
      totalMarks: testResult.totalMarks,
      percentage: testResult.percentage,
      timeTaken: testResult.timeTaken,
      submittedAt: testResult.submittedAt,
      answers: testResult.answers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
