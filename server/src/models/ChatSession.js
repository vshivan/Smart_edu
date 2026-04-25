const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
  learner_id:      { type: String, required: true, index: true },
  course_id:       { type: String, default: null },
  messages:        [messageSchema],
  context_summary: { type: String, default: '' },
  total_tokens:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
