// backend/src/middleware/authMiddleware.js
// Authentication middleware for the Team Task Manager, using ES Modules.
// Decodes JWT and attaches user (including role) to the request object.

import jwt from 'jsonwebtoken'; // Import jsonwebtoken using ES module syntax
// Import User model using ES module syntax (ensure User.js is also ES module)
import User from '../models/User.js';

// The authentication middleware function
// Export using export const so it can be imported by name
export const protect = async (req, res, next) => {
  try {
    // Get the token from the Authorization header (e.g., "Bearer eyJ...")
    // Use optional chaining in case header is missing
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        // If no token is found, throw an error indicating authentication is required
        throw new Error('Authentication token missing.');
    }

    // Verify the token using the JWT secret from environment variables
    // jwt.verify automatically checks if the token is expired and if the signature is valid.
    // The decoded payload now includes the user's _id and role.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID from the token payload AND check if the token is still valid
    // by ensuring it exists in the user's tokens array in the database.
    // The user object fetched from the database will contain the role from the DB.
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      // If user not found or token invalid/expired, throw error
      // This could happen if the user was deleted or logged out from all sessions
      throw new Error('User not found or token invalid.');
    }

    // Attach the token and the full user object (including role from the database) to the request object
    // This makes user information and their role available in subsequent route handlers (req.user.role)
    req.token = token;
    req.user = user; // req.user now contains the user document with the 'role' field

    next(); // Proceed to the next middleware or route handler

  } catch (e) {
    // If any error occurs during the authentication process (missing token, invalid token, user not found)
    console.error("Authentication Error:", e.message); // Log the specific error message
    res.status(401).send({ error: 'Please authenticate.' }); // Send 401 Unauthorized status
  }
};

// If you have other middleware functions in this file, export them using export const as well.
