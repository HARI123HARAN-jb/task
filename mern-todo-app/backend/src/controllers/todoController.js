// backend/src/controllers/todoController.js
// This controller handles task/todo-related operations with Admin/User role logic,
// using ES Modules.

// Import necessary models using ES module syntax
import Todo from '../models/Todo.js'; // Import Todo model (ensure Todo.js is ES module)
import User from '../models/User.js'; // Import User model (ensure User.js is ES module)


// --- Helper function to check if a user is an Admin ---
const isAdmin = (user) => user && user.role === 'Admin';

// --- Controller function to create a new task/todo ---
// Protected by auth middleware. Handles task assignment based on role.
// Export using export const
export const createTask = async (req, res) => {
  // req.user is available due to auth middleware (assuming it attaches user)
  const creator = req.user; // The user making the request

  try {
    let ownerId; // The ID of the user who will own the task/todo

    // If the creator is an Admin AND they provided an ownerId in the request body, use that
    if (isAdmin(creator) && req.body.owner) {
      // Validate that the provided ownerId is a valid user ID
      const assignedUser = await User.findById(req.body.owner);
      if (!assignedUser) {
        return res.status(400).send({ error: 'Assigned user not found.' });
      }
      ownerId = assignedUser._id; // Assign the task/todo to the specified user
      console.log(`Admin ${creator.name} is assigning task/todo to user ${assignedUser.name}`); // Log admin assignment
    } else {
      // If the creator is NOT an Admin, or no ownerId was provided, assign the task/todo to the creator
      ownerId = creator._id;
      console.log(`User ${creator.name} is creating task/todo for themselves.`); // Log user creating own task/todo
    }

    // Create a new task/todo instance
    const task = new Todo({ // Use Todo model
      ...req.body, // Copies text, completed, dueDate, tag, parentTask from request body
      owner: ownerId // Set the owner based on the logic above
    });

    await task.save(); // Save the new task/todo to the database

    // Populate owner and parentTask before sending response
     const populatedTask = await Todo.findById(task._id) // Use Todo model
       .populate('owner', 'name email') // Populate owner, only include name and email fields
       .populate('parentTask', 'text') // Populate parentTask, only include text field
       .exec();


    res.status(201).send(populatedTask); // Send back the created task/todo

  } catch (e) {
    console.error('Error creating task/todo:', e); // Log the error
    // Handle Mongoose validation errors (e.g., invalid ObjectId for parentTask, missing required fields)
    if (e.name === 'ValidationError') {
         return res.status(400).send({ error: e.message });
    }
    res.status(400).send(e); // Send back 400 status with error
  }
};

// --- Controller function to fetch tasks/todos ---
// Protected by auth middleware. Admin sees all tasks/todos, User sees only their tasks/todos.
// Export using export const
export const getTasks = async (req, res) => { // Keeping getTasks name for consistency with routes
  const requester = req.user; // The user making the request

  try {
    let tasks;
    // Admin can view all tasks/todos
    if (isAdmin(requester)) {
      console.log(`Admin ${requester.name} is fetching all tasks/todos.`); // Log admin access
      // Fetch all tasks/todos. Can add sorting/filtering based on query params if needed later.
      // Sorting by parentTask first, then createdAt can help with hierarchy display
      tasks = await Todo.find({}) // Use Todo model
        .populate('owner', 'name email') // Populate owner for Admin view
        .populate('parentTask', 'text') // Populate parentTask
        // Sort by parentTask (nulls first for top-level), then by createdAt
        .sort({ parentTask: 1, createdAt: 1 })
        .exec();

    } else {
      // Regular User can only view tasks/todos assigned to them
      console.log(`User ${requester.name} is fetching their tasks/todos.`); // Log user access
      // Fetch tasks/todos owned by the authenticated user
      // We fetch all tasks/todos for the user to enable frontend hierarchy building
      tasks = await Todo.find({ owner: requester._id }) // Use Todo model
        .populate('owner', 'name email') // Populate owner (will be the user themselves)
        .populate('parentTask', 'text') // Populate parentTask
        // Sort by parentTask (nulls first for top-level), then by createdAt
        .sort({ parentTask: 1, createdAt: 1 })
        .exec();
    }

    res.send(tasks); // Send the fetched tasks/todos

  } catch (e) {
    console.error('Error fetching tasks/todos:', e); // Log the error
    res.status(500).send(); // Send 500 status
  }
};

// --- Controller function to fetch a single task/todo by ID ---
// Protected by auth middleware. Admin can get any task/todo, User can only get their tasks/todos.
// Export using export const
export const getTaskById = async (req, res) => { // Keeping getTaskById name
  const _id = req.params.id; // Get task/todo ID from URL
  const requester = req.user; // The user making the request

  try {
    let task;
    // Find the task/todo by ID. Authorization check depends on role.
    if (isAdmin(requester)) {
       console.log(`Admin ${requester.name} is fetching task/todo by ID: ${_id}`); // Log admin access
       task = await Todo.findById(_id) // Use Todo model - Admin can find any task/todo
         .populate('owner', 'name email')
         .populate('parentTask', 'text')
         .exec();

    } else {
      // Regular User can only fetch tasks/todos owned by them
      console.log(`User ${requester.name} is fetching their task/todo by ID: ${_id}`); // Log user access
      task = await Todo.findOne({ _id, owner: requester._id }) // Use Todo model - User can only find their tasks/todos
        .populate('owner', 'name email')
        .populate('parentTask', 'text')
        .exec();
    }


    if (!task) {
      return res.status(404).send(); // Send 404 if task/todo not found or not authorized
    }

    res.send(task); // Send back the found task/todo

  } catch (e) {
    console.error(`Error fetching task/todo by ID ${_id}:`, e); // Log the error
    res.status(500).send(); // Send 500 for other errors
  }
};


// --- Controller function to update a task/todo by ID ---
// Protected by auth middleware. Admin can update any task/todo, User can only update their tasks/todos.
// Export using export const
export const updateTask = async (req, res) => { // Keeping updateTask name
  const _id = req.params.id; // Get task/todo ID from URL
  const requester = req.user; // The user making the request

  // Allowed updates array, including 'parentTask' and 'owner'
  const allowedUpdates = ['text', 'completed', 'dueDate', 'tag', 'parentTask', 'owner']; // Include owner as updatable field (only for Admin)
  const updates = Object.keys(req.body);

  // Check if all requested updates are allowed
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    let task;

    // Find the task/todo by ID. Authorization check depends on role.
    if (isAdmin(requester)) {
       console.log(`Admin ${requester.name} is updating task/todo by ID: ${_id}`); // Log admin access
       task = await Todo.findById(_id); // Use Todo model - Admin can find any task/todo
    } else {
       console.log(`User ${requester.name} is updating their task/todo by ID: ${_id}`); // Log user access
       task = await Todo.findOne({ _id, owner: requester._id }); // Use Todo model - User can only find their tasks/todos
    }


    if (!task) {
      return res.status(404).send(); // Send 404 if task/todo not found or not authorized
    }

    // --- Validation: Prevent a task/todo from being its own parent ---
    if (req.body.parentTask && req.body.parentTask.toString() === task._id.toString()) {
        return res.status(400).send({ error: 'A task/todo cannot be its own parent.' });
    }
    // --- Validation: Prevent creating cycles (basic check) ---
    // This basic check prevents setting an existing child as a parent.
    // More robust cycle detection would involve traversing the tree upwards.
    if (req.body.parentTask) {
        let potentialParentId = req.body.parentTask;
        let current = await Todo.findById(potentialParentId); // Use Todo model
        while(current) {
            if (current._id.toString() === task._id.toString()) {
                 return res.status(400).send({ error: 'Cannot set a descendant task/todo as a parent (creates a cycle).' });
            }
            // If the potential parent has a parent, move up the hierarchy
            current = current.parentTask ? await Todo.findById(current.parentTask) : null; // Use Todo model
        }
    }
    // --- End Validation ---


    // Apply updates to the found task/todo document
    updates.forEach((update) => {
        // Prevent non-admins from changing the 'owner' field
        if (update === 'owner' && !isAdmin(requester)) {
            // Ignore the owner update if not an admin
            console.warn(`User ${requester.name} attempted to change owner of task/todo ${_id}`);
        } else {
            task[update] = req.body[update];
        }
    });

     // If Admin is changing owner, validate the new owner exists (handled in the loop above now)
     // If req.body.owner was included and requester is Admin, it's applied in the loop.
     // No extra check needed here.


    await task.save(); // Save the updated task/todo

    // Populate owner and parentTask before sending response
    const populatedTask = await Todo.findById(task._id) // Use Todo model
       .populate('owner', 'name email')
       .populate('parentTask', 'text')
       .exec();


    res.send(populatedTask); // Send back the updated task/todo

  } catch (e) {
    console.error(`Error updating task/todo by ID ${_id}:`, e); // Log the error
    // Check for Mongoose validation errors
    if (e.name === 'ValidationError') {
         return res.status(400).send({ error: e.message });
    }
    res.status(400).send(e); // Send 400 for other errors
  }
};


// --- Controller function to delete a task/todo by ID ---
// Protected by auth middleware. Admin can delete any task/todo, User can only delete their tasks/todos.
// Export using export const
export const deleteTask = async (req, res) => { // Keeping deleteTask name
  const _id = req.params.id; // Get task/todo ID from URL
  const requester = req.user; // The user making the request

  try {
    let task;
    // Find the task/todo by ID. Authorization check depends on role.
    if (isAdmin(requester)) {
       console.log(`Admin ${requester.name} is deleting task/todo by ID: ${_id}`); // Log admin access
       // Use findByIdAndDelete which triggers pre('findOneAndDelete') middleware for cascade delete
       task = await Todo.findByIdAndDelete(_id); // Use Todo model - Admin can delete any task/todo
    } else {
       console.log(`User ${requester.name} is deleting their task/todo by ID: ${_id}`); // Log user access
       // Find and delete the task/todo ensuring it's owned by the user. Triggers middleware.
       task = await Todo.findOneAndDelete({ _id, owner: requester._id }); // Use Todo model - User can only delete their tasks/todos
    }


    if (!task) {
      return res.status(404).send(); // Send 404 if task/todo not found or not authorized
    }

    res.send(task); // Send back the deleted task/todo

  } catch (e) {
    console.error(`Error deleting task/todo by ID ${_id}:`, e); // Log the error
    res.status(500).send(); // Send 500 for other errors
  }
};

// --- Controller function to fetch all tasks for a given team ---
export const getTasksForTeam = async (req, res) => {
  const { teamId } = req.params;
  const requester = req.user;
  try {
    // Find the team and its members
    const Team = (await import('../models/Team.js')).default;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).send({ error: 'Team not found.' });
    }
    // If not admin, check membership
    if (!isAdmin(requester) && !team.members.map(id => id.toString()).includes(requester._id.toString())) {
      return res.status(403).send({ error: 'You are not a member of this team.' });
    }
    // Get all tasks where team is teamId OR owner is in team.members
    const teamTasks = await Todo.find({
      $or: [
        { team: teamId },
        { owner: { $in: team.members } }
      ]
    })
      .populate('owner', 'name email')
      .populate('parentTask', 'text')
      .sort({ parentTask: 1, createdAt: 1 })
      .exec();
    res.send(teamTasks);
  } catch (e) {
    console.error('Error fetching tasks for team:', e);
    res.status(500).send({ error: 'Failed to fetch team tasks.' });
  }
};

// Note: No module.exports = { ... } needed when using export const for individual functions
