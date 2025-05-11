// backend/models/Todo.js
// Task/Todo Mongoose model for the Team Task Manager, using ES Modules.
// Includes parentTask field for hierarchy and cascade delete middleware.

import mongoose from 'mongoose'; // Import mongoose using ES module syntax
// Import User model using ES module syntax (ensure User.js is also ES module)
// This import is needed for the 'owner' reference.
import User from './User.js';

const todoSchema = new mongoose.Schema({ // Using todoSchema to match the file name context
  text: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  owner: { // The user this task/todo is assigned TO
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Links task/todo to a user
  },
  dueDate: {
    type: Date,
    required: false
  },
  tag: {
    type: String,
    trim: true,
    required: false
  },
  // --- ADDED: Team field for team tasks ---
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false // Only set for team tasks
  },
  // --- End ADDED ---
  // --- ADDED: Field to reference the parent task/todo for hierarchy ---
  parentTask: { // Keeping parentTask name for clarity of hierarchical relationship
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Todo', // References this model itself (Todo)
    required: false // Optional for top-level tasks/todos
  }
  // --- End ADDED ---
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// --- ADDED: Middleware to delete child tasks/todos when a parent task/todo is removed (Cascade Delete) ---
// 'this' in pre middleware refers to the query object, not the document
// Using 'findOneAndDelete' hook
todoSchema.pre('findOneAndDelete', async function(next) {
    const query = this.getQuery(); // Get the query being executed (e.g., { _id: task._id, owner: user._id })
    const taskIdToDelete = query._id; // Extract the ID of the task/todo being deleted
    console.log(`Todo pre-delete middleware: Deleting todo with ID: ${taskIdToDelete}. Checking for children.`); // Log for debugging

    try {
        // Find all tasks/todos whose parentTask is the ID of the task/todo being deleted
        // Ensure these children also belong to the same owner for safety
        // Use 'mongoose.model('Todo')' to access the model within middleware if 'Todo' is not directly in scope
        const childTasks = await mongoose.model('Todo').find({ parentTask: taskIdToDelete, owner: query.owner });
        console.log(`Todo pre-delete middleware: Found ${childTasks.length} child todos to delete.`); // Log count

        // If there are children, delete them recursively
        if (childTasks.length > 0) {
             // To trigger the 'findOneAndDelete' middleware recursively for each child (ensuring deep cascade),
             // we iterate and call findOneAndDelete for each child.
             for (const child of childTasks) {
                 console.log(`Todo pre-delete middleware: Deleting child todo: ${child._id}`);
                 // Use 'mongoose.model('Todo')' to call findOneAndDelete recursively
                 await mongoose.model('Todo').findOneAndDelete({ _id: child._id, owner: query.owner });
             }
        }
        console.log(`Todo pre-delete middleware: Finished processing children for todo ${taskIdToDelete}.`); // Log completion

        next(); // Proceed with the original task/todo deletion

    } catch (e) {
        console.error(`Todo pre-delete middleware: Error during cascade delete for todo ${taskIdToDelete}:`, e); // Log errors
        next(e); // Pass the error to the next middleware/error handler
    }
});
// --- End ADDED ---


const Todo = mongoose.model('Todo', todoSchema); // Create the Mongoose model named 'Todo'

// Export the model using ES module syntax as the default export
export default Todo;
