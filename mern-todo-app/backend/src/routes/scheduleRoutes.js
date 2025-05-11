// backend/src/routes/scheduleRoutes.js
// This file defines the routes for schedule operations, using ES Modules.

import express from 'express'; // Import express using ES module syntax
// Import the specific controller functions for schedules using ES module import
// Ensure scheduleController.js uses ES module exports (export const ...)
import {
    getSchedules,
    createSchedule,
    getScheduleById,
    updateSchedule,
    deleteSchedule
} from '../controllers/scheduleController.js';

// Import the authentication middleware using ES module import
// Ensure authMiddleware.js exports 'protect' using export const
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define routes for schedules and protect them with the 'protect' middleware
// These routes use the controller functions designed for schedule management

// GET /api/schedules - Fetch schedules (logic in controller determines what user sees)
// Route path is '/' relative to where this router is mounted (e.g., /api/schedules/)
router.get('/', protect, getSchedules);

// POST /api/schedules - Create a new schedule (logic in controller handles user association)
// Route path is '/' relative to where this router is mounted
router.post('/', protect, createSchedule);

// GET /api/schedules/:id - Fetch a single schedule by ID
// Route path is '/:id' relative to where this router is mounted
router.get('/:id', protect, getScheduleById);

// PATCH /api/schedules/:id - Update a schedule by ID
// Route path is '/:id' relative to where this router is mounted
router.patch('/:id', protect, updateSchedule);

// DELETE /api/schedules/:id - Delete a schedule by ID
// Route path is '/:id' relative to where this router is mounted
router.delete('/:id', protect, deleteSchedule);


// Note: If your main server file (server.js or app.js) mounts this router
// under a base path like '/api/schedules', these routes will be accessible at
// /api/schedules/, /api/schedules/:id, etc.


// Export the router using ES module syntax as the default export
export default router;
