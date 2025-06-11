const mongoose = require('mongoose');

const drawingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, required: true }, // Canvas data URL
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Drawing', drawingSchema);