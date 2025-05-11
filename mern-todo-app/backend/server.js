// backend/server.js
// Main server file for the MERN Taskflow backend, using ES Modules.

console.log('--- Starting backend/server.js ---');

// Import necessary modules using ES Module syntax
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import aiController from './src/controllers/aiController.js'; // Import Gemini AI controller (to be created)
import { protect } from './src/middleware/authMiddleware.js'; // Import protect middleware
import http from 'http'; // ADDED: Import http
import { Server as SocketIOServer } from 'socket.io'; // ADDED: Import Socket.IO
import Message from './src/models/Message.js'; // ADDED: Import Message model

// Load environment variables early from .env file
dotenv.config();

// Import your route files using ES Module syntax
// Ensure these route files (authRoutes.js, todoRoutes.js, scheduleRoutes.js, teamRoutes.js)
// are located in ./src/routes/ and export their routers as the default export.
import authRoutes from './src/routes/authRoutes.js';
import todoRoutes from './src/routes/todoRoutes.js';
import scheduleRoutes from './src/routes/scheduleRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js'; // ADDED: Import team routes
import chatRoutes from './src/routes/chatRoutes.js'; // Import chat routes
import groupRoutes from './src/routes/groupRoutes.js'; // Import group routes


const app = express();
const server = http.createServer(app); // ADDED: Create http server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow all origins for dev; restrict in prod
    methods: ['GET', 'POST']
  }
});
// Define the port the server will listen on, using environment variable or default
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Use CORS middleware to allow cross-origin requests from your frontend
app.use(cors());
// Use express.json() middleware to parse incoming JSON requests
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static('uploads'));


// --- Use the specific API Routes ---
// Mount the routers under their respective base paths
// Requests starting with these paths will be directed to the corresponding router
app.use('/api/auth', authRoutes); // Authentication routes under /api/auth
app.use('/api', todoRoutes); // Task/Todo routes under /api/tasks
app.use('/api/schedules', scheduleRoutes); // Schedule routes under /api/schedules
app.use('/api/teams', teamRoutes); // ADDED: Team routes under /api/teams
app.use('/api/chat', chatRoutes); // Mount chat routes
app.use('/api/groups', groupRoutes); // Mount group routes
// Add Gemini AI chat route (admin only)
app.post('/api/ai/gemini', protect, aiController.geminiChatHandler);


// --- Basic root route (optional) ---
// A simple route to confirm the server is running
app.get('/', (req, res) => {
  res.send('MERN Taskflow Backend is Running!');
});


// --- Socket.IO Real-Time Team Chat ---
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Join a team room
  socket.on('joinTeamRoom', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`Socket ${socket.id} joined room team_${teamId}`);
  });

  // Leave a team room
  socket.on('leaveTeamRoom', (teamId) => {
    socket.leave(`team_${teamId}`);
    console.log(`Socket ${socket.id} left room team_${teamId}`);
  });

  // Handle sending a chat message to a team
  socket.on('teamChatMessage', async ({ teamId, message, sender, senderName }) => {
    try {
      // Save message to DB
      const saved = await Message.create({
        team: teamId,
        sender: sender, // should be userId
        senderName: senderName, // display name
        content: message
      });
      // Broadcast to everyone in the team room (including sender)
      io.to(`team_${teamId}`).emit('teamChatMessage', {
        message: saved.content,
        sender: saved.senderName,
        senderId: saved.sender,
        timestamp: saved.createdAt
      });
    } catch (e) {
      console.error('Error saving team chat message:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});


// --- Database Connection and Server Start ---
// Connect to MongoDB using the URI from environment variables
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    // Start the server after successful DB connection
    server.listen(PORT, () => { // CHANGED: use server.listen
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Optionally exit the process if DB connection fails, as the app cannot function without it
    // process.exit(1);
  });

console.log('--- Finished setting up backend/server.js ---');
