import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createGroup, getGroups } from '../controllers/groupController.js';

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);

export default router; 