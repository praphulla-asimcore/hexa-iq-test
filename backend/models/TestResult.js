const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  answers: [{
    questionId: Number,
    questionText: String,
    selectedAnswer: String,
    isCorrect: Boolean,
    marks: {
      type: Number,
      default: 0
    }
  }],
  totalMarks: {
    type: Number,
    default: 0,
    max: 60
  },
  percentage: Number,
  timeTaken: Number, // in seconds
  browserFingerprint: String,
  suspiciousActivities: [{
    timestamp: Date,
    activity: String,
    details: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TestResult', testResultSchema);
