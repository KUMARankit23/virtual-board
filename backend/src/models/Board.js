const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'collaborator'],
    default: 'collaborator',
  },
});

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [memberSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board; 