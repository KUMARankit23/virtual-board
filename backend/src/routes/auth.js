const express = require('express');
const Board = require('../models/Board');
const router = express.Router();

// Invite user to board (admin only)
router.post('/invite', async (req, res) => {
  const { boardId, username } = req.body;
  try {
    const board = await Board.findOneAndUpdate(
      { boardId },
      { $addToSet: { invitedUsers: username } }, // prevents duplicates
      { new: true }
    );
    if (!board) return res.status(404).json({ msg: 'Board not found' });
    res.json({ msg: 'User invited', board });
  } catch (err) {
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// Create a new board
router.post('/create', async (req, res) => {
  const { boardId, invitedUsers } = req.body;
  try {
    if (!boardId) return res.status(400).json({ msg: 'Board ID is required' });
    let board = await Board.findOne({ boardId });
    if (!board) {
      board = new Board({ boardId, invitedUsers: invitedUsers || [], data: [] });
      await board.save();
    }
    res.json({ msg: 'Board created', boardId });
  } catch (err) {
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

module.exports = router;