// backend/src/controllers/authController.js
// This controller handles user authentication (signup, login, logout), Admin user creation,
// fetching all users, and deleting users, using ES Modules.

// Import necessary modules using ES module syntax
import User from '../models/User.js'; // Import User model (ensure User.js is ES module)
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
import bcrypt from 'bcryptjs'; // Import bcryptjs
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation


// --- Helper function to check if a user is an Admin ---
const isAdmin = (user) => user && user.role === 'Admin';


// --- Controller function for user signup (for regular users) ---
// Export using export const
export const signupUser = async (req, res) => {
  try {
    // Create a new user instance from the request body
    // Assuming req.body contains name, email, password
    // Role is defaulted to 'User' in the schema for regular signups
    const user = new User(req.body);

    await user.save(); // Save the user to the database (password hashing happens in model middleware)

    // Generate an authentication token for the new user
    const token = await user.generateAuthToken(); // Assuming generateAuthToken is a method on the User model

    // Send back the user object (excluding sensitive data via toJSON) and the token
    res.status(201).send({ user, token });

  } catch (e) {
    console.error('Error during user signup:', e); // Log the error
    // Handle duplicate email error specifically
    if (e.code === 11000) { // MongoDB duplicate key error code
        return res.status(400).send({ error: 'Email is already in use.' });
    }
    // Handle Mongoose validation errors (e.g., missing required fields)
    if (e.name === 'ValidationError') {
        return res.status(400).send({ error: e.message });
    }
    res.status(400).send(e); // Send back 400 for other errors
  }
};

// --- Controller function for user login ---
// Export using export const
export const loginUser = async (req, res) => {
  try {
    // Use the static findByCredentials method on the User model
    // Assuming findByCredentials is a static method on the User model that checks email and password
    const user = await User.findByCredentials(req.body.email, req.body.password);

    // Generate an authentication token for the logged-in user
    const token = await user.generateAuthToken(); // Assuming generateAuthToken is a method on the User model

    // Send back the user object (excluding sensitive data via toJSON) and the token
    res.send({ user, token });

  } catch (e) {
    console.error('Error during user login:', e); // Log the error
    res.status(400).send({ error: 'Unable to login.' }); // Send back 400 for login failure
  }
};

// --- Controller function for user logout (single session) ---
// Protected by auth middleware. req.user and req.token are available.
// Export using export const
export const logoutUser = async (req, res) => {
  try {
    // Remove the current token from the user's tokens array
    // This logs out the specific session associated with the token
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save(); // Save the user with the token removed

    res.send({ message: 'Logged out successfully from this session.' });

  } catch (e) {
    console.error('Error during user logout:', e); // Log the error
    res.status(500).send(); // Send back 500 for server error
  }
};

// --- Controller function for user logout (all sessions) ---
// Protected by auth middleware. req.user is available.
// Export using export const
export const logoutAllUser = async (req, res) => {
  try {
    // Clear the entire tokens array
    req.user.tokens = [];
    await req.user.save(); // Save the user with all tokens removed

    res.send({ message: 'Logged out successfully from all sessions.' });

  } catch (e) {
    console.error('Error during user logout all:', e); // Log the error
    res.status(500).send(); // Send back 500 for server error
  }
};

// --- Controller function for Admin to create a new user ---
// Protected by auth middleware AND requires Admin role
// Export using export const
export const createUserByAdmin = async (req, res) => {
  const adminUser = req.user; // The authenticated Admin user

  // Check if the authenticated user is an Admin
  if (!isAdmin(adminUser)) {
    console.warn(`User ${adminUser.name} attempted to create a user but is not an Admin.`); // Log unauthorized attempt
    return res.status(403).send({ error: 'Only Admins can create new users.' }); // Send 403 Forbidden
  }

  try {
    // Create a new user instance from the request body
    // Admin can provide name, email, password, and optionally role
    const newUser = new User(req.body);

    // If Admin explicitly provides a role, use it (e.g., creating another Admin)
    // Otherwise, the default 'User' from the schema will apply
    if (req.body.role && (req.body.role === 'User' || req.body.role === 'Admin')) {
         newUser.role = req.body.role;
    } else {
         // Ensure role is set if not provided, schema default handles this but explicit is clearer
         newUser.role = newUser.role || 'User';
    }


    await newUser.save(); // Save the new user to the database (password hashing happens in model middleware)

    console.log(`Admin ${adminUser.name} successfully created user: ${newUser.email} with role ${newUser.role}`); // Log successful creation

    // Do NOT generate a token for the newly created user here.
    // The Admin is creating the account, not logging in as the new user.

    // Send back the newly created user object (excluding sensitive data via toJSON)
    res.status(201).send(newUser);

  } catch (e) {
    console.error('Error during Admin user creation:', e); // Log the error
    // Handle duplicate email error specifically
    if (e.code === 11000) { // MongoDB duplicate key error code
        return res.status(400).send({ error: 'Email is already in use.' });
    }
    // Handle Mongoose validation errors (e.g., missing required fields, invalid email format)
    if (e.name === 'ValidationError') {
        return res.status(400).send({ error: e.message });
    }
    res.status(400).send(e); // Send back 400 for other errors
  }
};

// --- Controller function for Admin to get all users ---
// Protected by auth middleware AND requires Admin role
// Export using export const
export const getAllUsers = async (req, res) => {
    const adminUser = req.user; // The authenticated Admin user

    // Check if the authenticated user is an Admin
    if (!isAdmin(adminUser)) {
        console.warn(`User ${adminUser.name} attempted to access get all users route but is not an Admin.`); // Log unauthorized attempt
        return res.status(403).send({ error: 'Only Admins can view all users.' }); // Send 403 Forbidden
    }

    try {
        // Find all users, excluding sensitive fields like password and tokens
        const users = await User.find({}).select('-password -tokens'); // Exclude password and tokens

        console.log(`Admin ${adminUser.name} successfully fetched ${users.length} users.`); // Log success

        // Send back the list of users
        res.status(200).send(users);

    } catch (e) {
        console.error('Error during Admin get all users:', e); // Log the error
        res.status(500).send(e); // Send back 500 for server error
    }
};

// --- ADDED: Controller function for Admin to delete a user by ID ---
// Protected by auth middleware. Requires Admin role.
// Export using export const
export const deleteUserByAdmin = async (req, res) => {
    const adminUser = req.user; // The authenticated Admin user
    const userIdToDelete = req.params.id; // Get user ID from URL parameter

    // Check if the authenticated user is an Admin
    if (!isAdmin(adminUser)) {
        console.warn(`User ${adminUser.name} attempted to delete user ${userIdToDelete} but is not an Admin.`); // Log unauthorized attempt
        return res.status(403).send({ error: 'Admin access required to delete users.' }); // Send 403 Forbidden
    }

    // Validate the provided user ID
    if (!userIdToDelete || !mongoose.Types.ObjectId.isValid(userIdToDelete)) {
        return res.status(400).send({ error: 'Invalid user ID provided.' });
    }

    // Prevent an Admin from deleting themselves
    if (adminUser._id.toString() === userIdToDelete.toString()) {
        console.warn(`Admin ${adminUser.name} attempted to delete their own account.`); // Log attempt
        return res.status(400).send({ error: 'Admins cannot delete their own account.' });
    }

    try {
        // Find and delete the user by ID
        // The pre('remove') middleware on the User model will handle deleting their tasks
        const userToDelete = await User.findByIdAndDelete(userIdToDelete);

        if (!userToDelete) {
            return res.status(404).send({ error: 'User not found.' }); // Send 404 if user not found
        }

        console.log(`Admin ${adminUser.name} successfully deleted user: ${userToDelete.email}`); // Log success

        res.status(200).send({ message: 'User deleted successfully', user: userToDelete }); // Send back deleted user info

    } catch (e) {
        console.error(`Error during Admin deleting user ${userIdToDelete}:`, e); // Log the error
        res.status(500).send(e); // Send back 500 for server error
    }
};
// --- End ADDED ---

// --- Controller function for user to update their own profile (PATCH /api/auth/me) ---
export const updateMe = async (req, res) => {
  try {
    const user = req.user;
    // Only allow updating certain fields
    const allowedUpdates = ['name', 'username', 'email', 'profilePic'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }
    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    await user.save();
    res.send(user);
  } catch (e) {
    console.error('Error updating profile:', e);
    res.status(400).send({ error: e.message });
  }
};

// --- Controller for uploading profile picture (POST /api/auth/me/profile-pic) ---
export const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: 'No file uploaded.' });
    }
    // Save the file path (relative to server root)
    const profilePicUrl = `/uploads/profile-pics/${req.file.filename}`;
    req.user.profilePic = profilePicUrl;
    await req.user.save();
    res.send({ profilePic: profilePicUrl });
  } catch (e) {
    console.error('Error uploading profile picture:', e);
    res.status(500).send({ error: 'Failed to upload profile picture.' });
  }
};

// Export all controller functions using export const
// Export all controller functions
// export {
//   signupUser, // Function to handle user signup
//   loginUser, // Function to handle user login
//   logoutUser, // Function to handle single session logout
//   logoutAllUser, // Function to handle logout from all sessions
//   createUserByAdmin, // Function for Admin to create a new user
//   getAllUsers, // Function for Admin to fetch all users
//   deleteUserByAdmin // Function for Admin to delete a user by ID
// };
