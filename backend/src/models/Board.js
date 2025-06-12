const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  boardId: { type: String, unique: true, required: true },
  invitedUsers: { type: [String], default: [] },
  data: { type: Array, default: [] }
});

module.exports = mongoose.model('Board', BoardSchema);