const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Board = require('../models/Board');
const User = require('../models/User');

// @route   POST api/boards
// @desc    Create a new board
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const newBoard = new Board({
      name,
      creator: req.user.id,
      members: [{ userId: req.user.id, role: 'admin' }],
    });

    const board = await newBoard.save();
    res.json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/boards
// @desc    Get all boards for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({
      'members.userId': req.user.id,
    }).populate('creator', 'username').populate('members.userId', 'username');
    res.json(boards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/boards/:id/invite
// @desc    Invite a user to a board
// @access  Private (Admin only)
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }

    // Check if the authenticated user is an admin of this board
    const isAdmin = board.members.some(
      (member) => member.userId.toString() === req.user.id && member.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ msg: 'User not authorized to invite to this board' });
    }

    const { email, role } = req.body;
    const userToInvite = await User.findOne({ email });

    if (!userToInvite) {
      return res.status(404).json({ msg: 'User with that email not found' });
    }

    // Check if user is already a member
    const isAlreadyMember = board.members.some(
      (member) => member.userId.toString() === userToInvite.id
    );

    if (isAlreadyMember) {
      return res.status(400).json({ msg: 'User is already a member of this board' });
    }

    board.members.push({ userId: userToInvite.id, role: role || 'collaborator' });
    await board.save();

    res.json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 