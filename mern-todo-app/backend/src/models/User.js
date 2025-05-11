// backend/models/User.js
// User Mongoose model using ES Modules.
// MODIFIED: Added username field.

import mongoose from 'mongoose'; // Import mongoose using ES module syntax
import validator from 'validator'; // Import validator using ES module syntax
import bcrypt from 'bcryptjs'; // Import bcryptjs using ES module syntax
import jwt from 'jsonwebtoken'; // Import jsonwebtoken using ES module syntax
// Import Todo model using ES module syntax (ensure Todo.js exists and is also ES module)
// This import is needed for the 'remove' middleware to delete user's tasks.
import Todo from './Todo.js';


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // ADDED: Username field
  username: {
    type: String,
    required: true, // Assuming username is required based on the unique index error
    unique: true,   // Must be unique to match the index causing the error
    trim: true,
    lowercase: true, // Often good practice for usernames
    // You might add validation here for allowed characters, min/max length etc.
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid');
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Password cannot contain "password"');
      }
    }
  },
  // --- ADDED: Role field for Admin/User ---
  role: {
    type: String,
    enum: ['User', 'Admin'], // Restrict possible values to 'User' or 'Admin'
    default: 'User' // Default role is 'User' for new users
  },
  // --- ADDED: Profile Picture field ---
  profilePic: {
    type: String, // URL or path to the profile picture
    default: '', // Default to empty string if not set
  },
  // --- End ADDED ---
  tokens: [{ // Array of tokens for multiple login sessions
    token: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Virtual property to establish relationship with Tasks/Todos
// Not stored in DB, just tells Mongoose how tasks/todos relate to user
userSchema.virtual('tasks', { // Keeping 'tasks' name for virtual for consistency if frontend uses it
  ref: 'Todo', // Reference the Todo model (assuming your task model is Todo.js)
  localField: '_id', // Field on the user model
  foreignField: 'owner' // Field on the todo model (the user the task/todo is assigned TO)
});

// Middleware to hash the plain text password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Middleware to delete user tasks/todos when user is removed
// Note: 'remove' middleware might be deprecated in newer Mongoose versions.
// Consider 'deleteMany' or 'deleteOne' hooks if using Mongoose v6+.
userSchema.pre('remove', async function(next) {
  const user = this;
  console.log(`User pre-remove middleware: Deleting tasks/todos for user: ${user._id}`); // Log for debugging
  try {
      // Delete all tasks/todos where the owner is this user's ID
      // Use the imported Todo model
      await Todo.deleteMany({ owner: user._id });
      console.log(`User pre-remove middleware: Deleted tasks/todos for user: ${user._id}`); // Log for debugging
      next(); // Proceed with user deletion
  } catch (e) {
      console.error(`User pre-remove middleware: Error deleting tasks/todos for user ${user._id}:`, e); // Log errors
      next(e); // Pass the error
  }
});


// Method to generate authentication token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  // Sign token with user ID and role
  const token = jwt.sign({ _id: user._id.toString(), role: user.role }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

// Method to hide sensitive data (password, tokens) when sending user object back
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  // Role is NOT deleted, so it will be included in the response

  return userObject;
};

// Static method to find user by credentials (email and password)
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Unable to login');
  }

  return user;
};

const User = mongoose.model('User', userSchema);

// Export the model using ES module syntax as the default export
export default User;
