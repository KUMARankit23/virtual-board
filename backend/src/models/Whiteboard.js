const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema({
  type: String,
  x0: Number,
  y0: Number,
  x1: Number,
  y1: Number,
  color: String,
  brushSize: Number,
  value: String, // For text elements
  fontSize: Number, // For text elements
  width: Number, // For rectangle elements
  height: Number, // For rectangle elements
  radius: Number, // For circle elements
});

const whiteboardSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  elements: [elementSchema],
});

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);

module.exports = Whiteboard; 