const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with authentication
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const drawingRoutes = require('./routes/drawings');
const auth = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/drawings', auth, drawingRoutes);

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling with rooms and drawing state
const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async (roomId) => {
    try {
      socket.join(roomId);
      
      // Track room participants
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      activeRooms.get(roomId).add(socket.id);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.userId,
        socketId: socket.id
      });

      // Send current room state to the new user
      const roomState = await getRoomState(roomId);
      socket.emit('room-state', roomState);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('draw', async (data) => {
    try {
      // Broadcast to others in the room
      socket.to(data.roomId).emit('draw', {
        ...data,
        userId: socket.userId
      });

      // Save drawing state
      await saveDrawingState(data.roomId, data);
    } catch (error) {
      socket.emit('error', { message: 'Failed to save drawing' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up room participants
    activeRooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        if (participants.size === 0) {
          activeRooms.delete(roomId);
        } else {
          socket.to(roomId).emit('user-left', {
            socketId: socket.id
          });
        }
      }
    });
  });
});

// Helper functions for room state management
async function getRoomState(roomId) {
  try {
    const Drawing = require('./models/Drawing');
    const drawing = await Drawing.findOne({ roomId, isActive: true });
    return drawing ? drawing.drawingData : [];
  } catch (error) {
    console.error('Error getting room state:', error);
    return [];
  }
}

async function saveDrawingState(roomId, data) {
  try {
    const Drawing = require('./models/Drawing');
    await Drawing.findOneAndUpdate(
      { roomId, isActive: true },
      { 
        $push: { drawingData: data },
        lastModified: new Date()
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error saving drawing state:', error);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});