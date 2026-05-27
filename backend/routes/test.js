const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Candidate = require('../models/Candidate');

// IQ Test Questions with Answers
const iqTestQuestions = [
  {
    id: 1,
    question: "YYZZZYZZY is to 221112112 as YYZZYZZY is to:",
    options: ["221221122", "22112122", "22112112", "112212211", "212211212"],
    correctAnswer: "22112112",
    marks: 1
  },
  {
    id: 2,
    question: "Which of the five is least like the other four?",
    options: ["NICKEL", "TIN", "STEEL", "IRON", "COPPER"],
    correctAnswer: "STEEL",
    marks: 1
  },
  {
    id: 3,
    question: "Jerry received both the 15th highest and the 15th lowest mark in the class. How many students are in the class?",
    options: ["15", "25", "29", "30", "32"],
    correctAnswer: "29",
    marks: 1
  },
  {
    id: 4,
    question: "Which of the five is least like the other four?",
    options: ["DICTIONARY", "BIOGRAPHY", "ATLAS", "ALMANAC", "DIRECTORY"],
    correctAnswer: "BIOGRAPHY",
    marks: 1
  },
  {
    id: 5,
    question: "Foot is to hand as leg is to:",
    options: ["ELBOW", "PIANO", "TOE", "FINGER", "ARM"],
    correctAnswer: "ARM",
    marks: 1
  },
  {
    id: 6,
    question: "If all Ferpies are Worgs and no Worgs are Sprickles, then no Sprickles are definitely Ferpies.",
    options: ["TRUE", "FALSE", "NEITHER"],
    correctAnswer: "TRUE",
    marks: 1
  },
  {
    id: 7,
    question: "Of the following numbers, which one is least like the others?",
    options: ["1", "3", "5", "7", "11"],
    correctAnswer: "11",
    marks: 1
  },
  {
    id: 8,
    question: "Terry is older than Mark and Sam is younger than Terry. Which of the following statements is most accurate?",
    options: ["Sam is older than Mark", "Sam is younger than Mark", "Sam is as old as Mark", "It is impossible to tell whether Sam or Mark is older"],
    correctAnswer: "It is impossible to tell whether Sam or Mark is older",
    marks: 1
  },
  {
    id: 9,
    question: "Leap is to peal as 8326 is to:",
    options: ["2368", "6283", "2683", "6328", "3628"],
    correctAnswer: "6283",
    marks: 1
  },
  {
    id: 10,
    question: "Anne received $0.59 in change from a supermarket purchase. Of the eleven coins she received in change, three were exactly alike. These three coins had to be:",
    options: ["PENNIES", "NICKELS", "DIMES", "QUARTERS", "HALF DOLLARS"],
    correctAnswer: "NICKELS",
    marks: 1
  },
  {
    id: 11,
    question: "Which of the five is least like the other four?",
    options: ["PECK", "OUNCE", "PINT", "CUP", "QUART"],
    correctAnswer: "OUNCE",
    marks: 1
  },
  {
    id: 12,
    question: "Three enemy messages were intercepted. 'Berok tenlis krux' means 'Secret attack Wednesday' and 'Baroom zax tenlis' means 'Secret plans included' and 'Gradnor berok plil elan' means 'Wednesday victory is ours.' What does 'krux' mean?",
    options: ["SECRET", "WEDNESDAY", "NOTHING", "ATTACK", "PLANS"],
    correctAnswer: "ATTACK",
    marks: 1
  },
  {
    id: 13,
    question: "Love is to hate as valor is to:",
    options: ["COURAGE", "SECURITY", "COWARDICE", "ANGER", "TERROR"],
    correctAnswer: "COWARDICE",
    marks: 1
  },
  {
    id: 14,
    question: "The price of an article was cut 50% for a sale. By what percent must the price of the item be increased to again sell the item at the original price?",
    options: ["25%", "50%", "75%", "100%", "200%"],
    correctAnswer: "100%",
    marks: 1
  },
  {
    id: 15,
    question: "Which of the five is least like the other four?",
    options: ["SQUASH", "PUMPKIN", "TOMATO", "CUCUMBER", "CORN"],
    correctAnswer: "CORN",
    marks: 1
  },
  {
    id: 16,
    question: "Hole is to donut as pages are to:",
    options: ["STORY", "WORDS", "CONTENTS", "INDEX", "COVER"],
    correctAnswer: "BOOK",
    marks: 1
  },
  {
    id: 17,
    question: "Kim was sent to the store to get 11 large cans of fruit. Kim could carry only 2 cans at a time. How many trips to the store did Kim have to make?",
    options: ["5", "5.5", "6", "6.5", "7"],
    correctAnswer: "6",
    marks: 1
  },
  {
    id: 18,
    question: "If all Pleeps are Floops and all Floops are Leepies, then all Pleeps are definitely Leepies.",
    options: ["TRUE", "FALSE", "NEITHER"],
    correctAnswer: "TRUE",
    marks: 1
  },
  {
    id: 19,
    question: "Jim, John, Jerry, and Joe together bought a basket of 144 apples. Jim received 10 more apples than John, 26 more than Jerry, and 32 more than Joe. How many apples did Jim receive?",
    options: ["73", "63", "53", "43", "27"],
    correctAnswer: "73",
    marks: 1
  },
  {
    id: 20,
    question: "Which of the five is least like the other four?",
    options: ["TOUCH", "SEE", "HEAR", "EAT", "SMELL"],
    correctAnswer: "EAT",
    marks: 1
  },
  {
    id: 21,
    question: "Daughter is to father as niece is to:",
    options: ["NEPHEW", "COUSIN", "UNCLE", "MOTHER", "BROTHER"],
    correctAnswer: "UNCLE",
    marks: 1
  },
  {
    id: 22,
    question: "Bark is to tree as scales are to:",
    options: ["GILLS", "ELEPHANT", "BUTCHER", "FISH", "SKIN"],
    correctAnswer: "FISH",
    marks: 1
  },
  {
    id: 23,
    question: "Which of the five is least like the other four?",
    options: ["TURKEY", "DUCK", "CHICKEN", "PHEASANT", "GOOSE"],
    correctAnswer: "CHICKEN",
    marks: 1
  },
  {
    id: 24,
    question: "The secher vlooped quaply berak the kriggly lool. Then the secher ______ flaxly down the kleek. Which word belongs in the space?",
    options: ["VLOPPED", "QUAPLY", "BERAK", "LOOL", "KRIGGLY"],
    correctAnswer: "VLOPPED",
    marks: 1
  },
  {
    id: 25,
    question: "The fish has a head 9 inches long. The tail is equal to the size of the head plus one-half the size of the body. The body is the size of the head plus the tail. How long is the fish?",
    options: ["27 inches", "54 inches", "63 inches", "72 inches", "81 inches"],
    correctAnswer: "72 inches",
    marks: 1
  },
  {
    id: 26,
    question: "If you rearrange the letters in 'NAICH,' you would have the name of a(n):",
    options: ["COUNTRY", "OCEAN", "STATE", "CITY", "ANIMAL"],
    correctAnswer: "CITY",
    marks: 1
  },
  {
    id: 27,
    question: "Jack is 15 years old, three times as old as his sister. How old will Jack be when he is twice as old as his sister?",
    options: ["18", "20", "24", "26", "30"],
    correctAnswer: "20",
    marks: 1
  },
  {
    id: 28,
    question: "Siok are more zitful than mulk, but pringling flex are most____of all. Which word belongs in the blank space?",
    options: ["SLOK", "ZITFUL", "MULK", "PRINGLING", "FLEX"],
    correctAnswer: "ZITFUL",
    marks: 1
  },
  {
    id: 29,
    question: "If you rearrange the letters in 'SHORE,' you would have the name of a(n):",
    options: ["COUNTRY", "OCEAN", "STATE", "CITY", "ANIMAL"],
    correctAnswer: "OCEAN",
    marks: 1
  },
  {
    id: 30,
    question: "Which number does not belong in the following series? 1, 3, 5, 7, 9, 11, 12, 13, 15",
    options: ["1", "3", "5", "7", "12"],
    correctAnswer: "12",
    marks: 1
  },
  {
    id: 31,
    question: "Gas is to car as food is to:",
    options: ["MOUTH", "STOMACH", "ENERGY", "BODY", "TEETH"],
    correctAnswer: "BODY",
    marks: 1
  },
  {
    id: 32,
    question: "Which of the five is least like the other four?",
    options: ["WICHITA", "DALLAS", "CANTON", "BANGOR", "FRESNO"],
    correctAnswer: "DALLAS",
    marks: 1
  },
  {
    id: 33,
    question: "If some Tripples are Tropples and all Bolars are Tropples, then some Tripples are definitely Bolars.",
    options: ["TRUE", "FALSE", "NEITHER"],
    correctAnswer: "NEITHER",
    marks: 1
  },
  {
    id: 34,
    question: "Light is to moon as book is to:",
    options: ["TACK", "CHECK", "TURF", "BURN", "TOY"],
    correctAnswer: "CHECK",
    marks: 1
  },
  {
    id: 35,
    question: "Which letter does not belong in the following series? B, E, H, K, M, N, Q, T",
    options: ["B", "E", "H", "K", "M"],
    correctAnswer: "M",
    marks: 1
  },
  {
    id: 36,
    question: "Pillow is to pillowcase as arm is to:",
    options: ["BODY", "SLEEVE", "HAND", "GLOVE", "RING"],
    correctAnswer: "SLEEVE",
    marks: 1
  },
  {
    id: 37,
    question: "If all Truples are Glogs and some Glogs are Glips, then some Truples are definitely Glips.",
    options: ["TRUE", "FALSE", "NEITHER"],
    correctAnswer: "NEITHER",
    marks: 1
  },
  {
    id: 38,
    question: "If you rearrange the letters in 'TALCATIN,' you would have the name of a(n):",
    options: ["COUNTRY", "OCEAN", "STATE", "CITY", "ANIMAL"],
    correctAnswer: "CITY",
    marks: 1
  },
  {
    id: 39,
    question: "Which of the five is least like the other four?",
    options: ["ARTIST", "GOLFER", "NEWSCASTER", "DANCER", "MECHANIC"],
    correctAnswer: "GOLFER",
    marks: 1
  },
  {
    id: 40,
    question: "Which of the five is least like the other four?",
    options: ["WATER", "SUN", "GASOLINE", "WIND", "CEMENT"],
    correctAnswer: "CEMENT",
    marks: 1
  }
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

// Get all test questions
router.get('/questions', verifyCandidateToken, (req, res) => {
  // Return questions without answers
  const questionsWithoutAnswers = iqTestQuestions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    marks: q.marks
  }));
  res.json(questionsWithoutAnswers);
});

// Get test info (for timer)
router.get('/info', verifyCandidateToken, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.candidate.candidateId);
    res.json({
      totalQuestions: iqTestQuestions.length,
      totalMarks: 60,
      timeLimit: 45 * 60, // 45 minutes in seconds
      startTime: candidate.testStartTime,
      testStarted: candidate.testStarted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate single answer (real-time feedback)
router.post('/validate-answer', verifyCandidateToken, (req, res) => {
  const { questionId, answer } = req.body;
  const question = iqTestQuestions.find(q => q.id === questionId);

  if (!question) {
    return res.status(400).json({ error: 'Question not found' });
  }

  const isCorrect = question.correctAnswer === answer;
  res.json({ isCorrect, correctAnswer: question.correctAnswer });
});

// Log suspicious activity
router.post('/log-activity', verifyCandidateToken, async (req, res) => {
  try {
    const { activity, details, timestamp } = req.body;
    const candidate = await Candidate.findById(req.candidate.candidateId);

    candidate.suspiciousActivities.push({
      timestamp: new Date(timestamp),
      activity,
      details
    });

    await candidate.save();
    res.json({ message: 'Activity logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set browser fingerprint
router.post('/set-fingerprint', verifyCandidateToken, async (req, res) => {
  try {
    const { fingerprint } = req.body;
    const candidate = await Candidate.findById(req.candidate.candidateId);

    if (candidate.browserFingerprint && candidate.browserFingerprint !== fingerprint) {
      candidate.suspiciousActivities.push({
        timestamp: new Date(),
        activity: 'Browser fingerprint mismatch',
        details: `Previous: ${candidate.browserFingerprint}, Current: ${fingerprint}`
      });
    }

    candidate.browserFingerprint = fingerprint;
    await candidate.save();

    res.json({ message: 'Fingerprint set' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export questions for other modules
module.exports = router;
module.exports.iqTestQuestions = iqTestQuestions;
