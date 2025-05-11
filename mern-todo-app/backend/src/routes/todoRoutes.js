// backend/src/routes/todoRoutes.js
// This file defines the routes for task/todo operations in the team manager,
// using ES Module imports and exports.

import express from 'express'; // Import express using ES module syntax
// Import the specific controller functions for tasks/todos using ES module import
// Ensure todoController.js uses ES module exports (export const ...)
import {
  createTask, // Import createTask from the controller
  getTasks,   // Import getTasks from the controller
  getTaskById, // Import getTaskById from the controller
  updateTask, // Import updateTask from the controller
  deleteTask,  // Import deleteTask from the controller
  getTasksForTeam // ADDED: Import getTasksForTeam
} from '../controllers/todoController.js';

// Import the authentication middleware using ES module import
// Ensure authMiddleware.js exports 'protect' using export const
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define routes for /tasks and protect them with the 'protect' middleware
// These routes use the controller functions designed for team task management

// POST /api/tasks - Create a new task/todo (Admin can assign, User creates for self)
// Route path is '/tasks' relative to where this router is mounted (e.g., /api/tasks)
router.post('/tasks', protect, createTask);

// GET /api/tasks - Fetch tasks/todos (Admin gets all, User gets their tasks/todos)
// Route path is '/tasks' relative to where this router is mounted
router.get('/tasks', protect, getTasks);

// GET /api/tasks/:id - Fetch a single task/todo by ID (Admin gets any, User gets their own)
// Route path is '/tasks/:id' relative to where this router is mounted
router.get('/tasks/:id', protect, getTaskById);

// PATCH /api/tasks/:id - Update a task/todo by ID (Admin updates any, User updates their own)
// Route path is '/tasks/:id' relative to where this router is mounted
router.patch('/tasks/:id', protect, updateTask);

// DELETE /api/tasks/:id - Delete a task/todo by ID (Admin deletes any, User deletes their own)
// Route path is '/tasks/:id' relative to where this router is mounted
router.delete('/tasks/:id', protect, deleteTask);

// GET /api/tasks/team/:teamId - Fetch all tasks for a given team (Admin or team member)
router.get('/tasks/team/:teamId', protect, getTasksForTeam);

// Note: If your main server file (server.js or app.js) mounts this router
// under a base path like '/api', the full paths will be /api/tasks, /api/tasks/:id, etc.
// Example in server.js: app.use('/api', todoRoutes);


// Export the router using ES module syntax as the default export
export default router;
