// backend/src/routes/teamRoutes.js
// This file defines the routes for team operations, using ES Modules.

import express from 'express'; // Import express using ES module syntax
// Import the specific controller functions for teams using ES module import
// Ensure teamController.js uses ES module exports (export const ...)
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getMyTeams
} from '../controllers/teamController.js';

// Import the authentication middleware using ES module import
// Ensure authMiddleware.js exports 'protect' using export const
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define routes for /teams and protect them with the 'protect' middleware
// The Admin role check is handled within the controller functions.

// GET /api/teams/my - Get all teams where the user is a member
router.get('/my', protect, getMyTeams);

// GET /api/teams/:id - Get a single team by ID (Admin only)
// Route path is '/:id' relative to where this router is mounted
router.get('/:id', protect, getTeamById);

// POST /api/teams - Create a new team (Admin only)
// Route path is '/' relative to where this router is mounted (e.g., /api/teams/)
router.post('/', protect, createTeam);

// GET /api/teams - Get all teams (Admin only)
// Route path is '/' relative to where this router is mounted
router.get('/', protect, getTeams);

// PATCH /api/teams/:id - Update a team by ID (Admin only)
// Route path is '/:id' relative to where this router is mounted
router.patch('/:id', protect, updateTeam);

// DELETE /api/teams/:id - Delete a team by ID (Admin only)
// Route path is '/:id' relative to where this router is mounted
router.delete('/:id', protect, deleteTeam);

// POST /api/teams/:id/members - Add a member to a team (Admin only)
// Route path is '/:id/members' relative to where this router is mounted
router.post('/:id/members', protect, addTeamMember);

// DELETE /api/teams/:id/members/:userId - Remove a member from a team (Admin only)
// Route path is '/:id/members/:userId' relative to where this router is mounted
router.delete('/:id/members/:userId', protect, removeTeamMember);

// Note: If your main server file (server.js or app.js) mounts this router
// under a base path like '/api/teams', these routes will be accessible at
// /api/teams/, /api/teams/:id, /api/teams/:id/members, etc.


// Export the router using ES module syntax as the default export
export default router;
