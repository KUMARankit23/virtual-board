const express = require('express');
const router = express.Router();
const Drawing = require('../models/Drawing');

router.post('/', async (req, res) => {
  try {
    const drawing = new Drawing({
      ...req.body,
      creator: req.user._id
    });
    await drawing.save();
    res.status(201).json(drawing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const drawings = await Drawing.find({
      $or: [
        { creator: req.user._id },
        { collaborators: req.user._id },
        { isPublic: true }
      ]
    });
    res.json(drawings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;