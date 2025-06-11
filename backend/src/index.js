const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Whiteboard = require('./models/Whiteboard'); // Import the Whiteboard model
const authRoutes = require('./routes/auth'); // Import auth routes
const boardRoutes = require('./routes/boards'); // Import board routes
const jwt = require('jsonwebtoken'); // Import jwt
const Board = require('./models/Board'); // Import Board model

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user; // Attach user info to socket
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Use auth routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes); // Use board routes

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual_board')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Virtual Board API is running' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async (roomId) => {
    // Verify user is a member of this board
    const board = await Board.findById(roomId);
    if (!board || !board.members.some(member => member.userId.toString() === socket.user.id)) {
      console.log(`User ${socket.user.id} not authorized to join room ${roomId}`);
      socket.emit('auth-error', 'Not authorized to join this board.');
      return;
    }

    socket.join(roomId);
    console.log(`User ${socket.user.id} joined room ${roomId}`);

    // Load existing whiteboard data for the room
    let whiteboard = await Whiteboard.findOne({ roomId });
    if (whiteboard) {
      socket.emit('load-whiteboard', whiteboard.elements);
    } else {
      // Create a new whiteboard if it doesn't exist
      whiteboard = new Whiteboard({ roomId, elements: [] });
      await whiteboard.save();
    }
  });

  socket.on('draw', async (data) => {
    // Check if user is authorized for this board
    const board = await Board.findById(data.roomId);
    if (!board || !board.members.some(member => member.userId.toString() === socket.user.id)) {
      return;
    }
    socket.to(data.roomId).emit('draw', data.drawingData);
    // Save drawing data to MongoDB
    await Whiteboard.findOneAndUpdate(
      { roomId: data.roomId },
      { $push: { elements: { type: 'draw', ...data.drawingData } } },
      { upsert: true }
    );
  });

  socket.on('text', async (data) => {
    // Check if user is authorized for this board
    const board = await Board.findById(data.roomId);
    if (!board || !board.members.some(member => member.userId.toString() === socket.user.id)) {
      return;
    }
    socket.to(data.roomId).emit('text', data.textData);
    // Save text data to MongoDB
    await Whiteboard.findOneAndUpdate(
      { roomId: data.roomId },
      { $push: { elements: { type: 'text', ...data.textData } } },
      { upsert: true }
    );
  });

  socket.on('shape', async (data) => {
    // Check if user is authorized for this board
    const board = await Board.findById(data.roomId);
    if (!board || !board.members.some(member => member.userId.toString() === socket.user.id)) {
      return;
    }
    socket.to(data.roomId).emit('shape', data.shapeData);
    // Save shape data to MongoDB
    await Whiteboard.findOneAndUpdate(
      { roomId: data.roomId },
      { $push: { elements: { type: 'shape', ...data.shapeData } } },
      { upsert: true }
    );
  });

  socket.on('clear-whiteboard', async (roomId) => {
    // Check if user is authorized for this board
    const board = await Board.findById(roomId);
    if (!board || !board.members.some(member => member.userId.toString() === socket.user.id)) {
      return;
    }
    await Whiteboard.findOneAndUpdate(
      { roomId: roomId },
      { $set: { elements: [] } },
      { upsert: true }
    );
    socket.to(roomId).emit('clear-canvas'); // Inform other clients to clear their canvas
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 