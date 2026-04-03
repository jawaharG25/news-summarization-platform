const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: [String], // Array of bullet points for 3-point summary
    required: true
  },
  sentiment: {
    type: Number, // Example: -1 to 1, or 0 to 100
    required: true
  },
  biasScore: {
    type: Number, // 0 to 100 (0=Left, 50=Center, 100=Right)
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Article', articleSchema);
