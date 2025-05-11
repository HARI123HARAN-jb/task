// backend/src/routes/authRoutes.js
// This file defines the routes for user authentication, Admin user creation,
// fetching all users, and deleting users, using ES Modules.

import express from 'express'; // Import express using ES module syntax
// Import the specific controller functions for authentication and admin user management
// Ensure authController.js uses ES module exports (export const ...)
import {
  signupUser,    // Import signupUser
  loginUser,     // Import loginUser
  logoutUser,    // Import logoutUser
  logoutAllUser, // Import logoutAllUser
  createUserByAdmin, // Import the function for Admin user creation
  getAllUsers, // Import the function to get all users
  deleteUserByAdmin, // Import the new function to delete a user
  updateMe,
  uploadProfilePic // <-- Add this
} from '../controllers/authController.js';

// Import the authentication middleware using ES module import
// Ensure authMiddleware.js exports 'protect' using export const
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

// Multer config for profile pics
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pics');
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, req.user._id + '-' + Date.now() + '.' + ext);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Define authentication routes using the controller functions

// POST /api/auth/signup - Register a new user (typically for regular users)
// This route does NOT require authentication
router.post('/signup', signupUser);

// POST /api/auth/login - Log in a user
// This route does NOT require authentication
router.post('/login', loginUser);

// POST /api/auth/logout - Log out the current user from the current session
// This route requires authentication, so apply the 'protect' middleware
router.post('/logout', protect, logoutUser);

// POST /api/auth/logoutAll - Log out the current user from all sessions
// This route requires authentication, so apply the 'protect' middleware
router.post('/logoutAll', protect, logoutAllUser);

// GET /api/auth/me - Get the authenticated user's profile
// This route requires authentication
router.get('/me', protect, async (req, res) => {
    // The 'protect' middleware attaches the user object to req.user
    // The toJSON method on the User model handles hiding sensitive data
    res.send(req.user); // Send back the authenticated user's profile (including role)
});

// PATCH /api/auth/me - Update the authenticated user's profile
router.patch('/me', protect, updateMe);

// POST /api/auth/me/profile-pic - Upload a profile picture file
router.post('/me/profile-pic', protect, upload.single('profilePic'), uploadProfilePic);

// --- Routes for Admin User Management ---
// These routes are protected and the Admin role check is done within the controller functions.

// POST /api/auth/users - Create a new user (Admin only)
router.post('/users', protect, createUserByAdmin);

// GET /api/auth/users - Get all users (Admin only)
router.get('/users', protect, getAllUsers);

// ADDED: DELETE /api/auth/users/:id - Delete a user by ID (Admin only)
router.delete('/users/:id', protect, deleteUserByAdmin);
// --- End Admin User Management Routes ---


// Export the router using ES module syntax as the default export
export default router;
