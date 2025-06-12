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
    res.status(500).json({ msg: err.message });
  }
});

router.post('/create', async (req, res) => {
  const { boardId, invitedUsers } = req.body;
  try {
    let board = await Board.findOne({ boardId });
    if (!board) {
      board = new Board({ boardId, invitedUsers, data: [] });
      await board.save();
    }
    res.json({ msg: 'Board created', boardId });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;