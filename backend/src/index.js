require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const Board = require('./models/Board');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io for board sessions
io.on('connection', (socket) => {
  socket.on('joinBoard', async (boardId) => {
    socket.join(boardId);
    // After io.on('connection', ...) and inside the function:
socket.on('inviteUser', ({ boardId, username }) => {
  io.to(boardId).emit('userInvited', { username });
});

    // Send current board data to the joining client
    try {
      const board = await Board.findOne({ boardId });
      if (board && board.data) {
        socket.emit('boardData', board.data);
      }
    } catch (err) {
      console.error('Error sending board data:', err);
    }
  });

  socket.on('draw', async (data) => {
    socket.to(data.boardId).emit('draw', data);

    // Save the drawing action to the board in MongoDB, create if not exists
    try {
      await Board.findOneAndUpdate(
        { boardId: data.boardId },
        { $push: { data } },
        { upsert: true } // <-- Ensures board is created if missing
      );
    } catch (err) {
      console.error('Error saving draw action:', err);
    }
  });

  socket.on('clear', async (boardId) => {
    socket.to(boardId).emit('clear');
    // Clear the board data in MongoDB, create if not exists
    try {
      await Board.findOneAndUpdate(
        { boardId },
        { $set: { data: [] } },
        { upsert: true } // <-- Ensures board is created if missing
      );
    } catch (err) {
      console.error('Error clearing board:', err);
    }
  });

  socket.on('disconnect', () => {
    // Optional: handle disconnect
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});