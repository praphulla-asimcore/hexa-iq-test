const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  invitationToken: String,
  invitationExpiry: Date,
  testStarted: Boolean,
  testCompleted: Boolean,
  testStartTime: Date,
  testEndTime: Date,
  browserFingerprint: String,
  suspiciousActivities: [{
    timestamp: Date,
    activity: String,
    details: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidate', candidateSchema);
