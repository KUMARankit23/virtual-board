const mongoose = require('mongoose');

const drawingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  drawingData: {
    type: Array,
    default: []
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
drawingSchema.index({ roomId: 1, isActive: 1 });
drawingSchema.index({ createdBy: 1 });

const Drawing = mongoose.model('Drawing', drawingSchema);

module.exports = Drawing; 