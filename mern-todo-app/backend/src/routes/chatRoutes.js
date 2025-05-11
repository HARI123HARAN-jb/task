import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendMessage, getMessages, sendGroupMessage, getGroupMessages, getTeamChatMessages } from '../controllers/chatController.js';

const router = express.Router();

// Send a message
router.post('/send', protect, sendMessage);
// Get all messages between current user and another user
router.get('/:userId', protect, getMessages);

// Group chat endpoints
router.post('/group/:groupId/send', protect, sendGroupMessage);
router.get('/group/:groupId', protect, getGroupMessages);

// Team chat endpoint
router.get('/team/:teamId', protect, getTeamChatMessages);

export default router; 