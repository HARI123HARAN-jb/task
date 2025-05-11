// backend/src/controllers/teamController.js
// This controller handles team-related operations, restricted to Admin users,
// using ES Modules.

// Import necessary models and modules using ES module syntax
import Team from '../models/Team.js'; // Import Team model (ensure Team.js is ES module)
import User from '../models/User.js'; // Import User model (ensure User.js is ES module)
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation


// --- Helper function to check if a user is an Admin ---
const isAdmin = (user) => user && user.role === 'Admin';


// --- Controller function to create a new team ---
// Protected by auth middleware. Requires Admin role.
// Export using export const
export const createTeam = async (req, res) => {
  const creator = req.user; // The authenticated user (should be Admin)

  // Check if the authenticated user is an Admin
  if (!isAdmin(creator)) {
    console.warn(`User ${creator.name} attempted to create a team but is not an Admin.`); // Log unauthorized attempt
    return res.status(403).send({ error: 'Admin access required to create teams.' }); // Send 403 Forbidden
  }

  try {
    // Create a new team instance from the request body
    // Assuming req.body contains name, description, and optionally an array of member user IDs
    const team = new Team({
      ...req.body, // Copies name, description, members from request body
      admin: creator._id // Set the admin of the team to the creator (the Admin user)
    });

    // Optional: Validate that the provided member IDs are valid User IDs
    if (req.body.members && Array.isArray(req.body.members)) {
         const validMembers = [];
         for (const memberId of req.body.members) {
             if (mongoose.Types.ObjectId.isValid(memberId)) {
                 const userExists = await User.exists({ _id: memberId }); // Check if user exists
                 if (userExists) {
                     validMembers.push(memberId);
                 } else {
                     console.warn(`Invalid member ID provided during team creation: ${memberId}`);
                 }
             } else {
                 console.warn(`Invalid ObjectId format for member ID during team creation: ${memberId}`);
             }
         }
         team.members = validMembers; // Assign only valid member IDs
    }


    await team.save(); // Save the new team to the database

    // Populate the members and admin fields before sending the response
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'name email') // Populate members, include name and email
      .populate('admin', 'name email') // Populate admin, include name and email
      .exec();


    res.status(201).send(populatedTeam); // Send back the created team

  } catch (e) {
    console.error('Error creating team:', e); // Log the error
    // Handle duplicate team name error specifically
    if (e.code === 11000) { // MongoDB duplicate key error code
         return res.status(400).send({ error: 'Team name is already in use.' });
    }
    // Handle Mongoose validation errors
    if (e.name === 'ValidationError') {
         return res.status(400).send({ error: e.message });
    }
    res.status(400).send(e); // Send back 400 status with other errors
  }
};

// --- Controller function to get all teams ---
// Protected by auth middleware. Requires Admin role.
// Export using export const
export const getTeams = async (req, res) => {
  const requester = req.user; // The authenticated user (should be Admin)

  // Check if the authenticated user is an Admin
  if (!isAdmin(requester)) {
    console.warn(`User ${requester.name} attempted to access ADMIN getTeams route but is not an Admin.`); // Clarified log
    return res.status(403).send({ error: 'Admin access required to view teams.' }); // Send 403 Forbidden
  }

  try {
    // Find all teams
    const teams = await Team.find({})
      .populate('members', 'name email') // Populate members
      .populate('admin', 'name email') // Populate admin
      .sort({ name: 1 }) // Sort by team name
      .exec();

    res.send(teams); // Send back the list of teams

  } catch (e) {
    console.error('Error fetching teams:', e); // Log the error
    res.status(500).send(); // Send 500 status
  }
};

// --- Controller function to get a single team by ID ---
// Protected by auth middleware. Requires Admin role.
// Export using export const
export const getTeamById = async (req, res) => {
  const _id = req.params.id; // Get team ID from URL
  const requester = req.user; // The authenticated user (should be Admin)

  // Check if the authenticated user is an Admin
  if (!isAdmin(requester)) {
    console.warn(`User ${requester.name} attempted to get team ${_id} but is not an Admin.`); // Log unauthorized attempt
    return res.status(403).send({ error: 'Admin access required to view team details.' }); // Send 403 Forbidden
  }

  try {
    // Find the team by ID
    const team = await Team.findById(_id)
      .populate('members', 'name email') // Populate members
      .populate('admin', 'name email') // Populate admin
      .exec();

    if (!team) {
      return res.status(404).send(); // Send 404 if team not found
    }

    res.send(team); // Send back the team

  } catch (e) {
    console.error(`Error fetching team by ID ${_id}:`, e); // Log the error
    res.status(500).send(); // Send 500 for other errors
  }
};

// --- Controller function to update a team by ID ---
// Protected by auth middleware. Requires Admin role.
// Export using export const
export const updateTeam = async (req, res) => {
  const _id = req.params.id; // Get team ID from URL
  const requester = req.user; // The authenticated user (should be Admin)

  // Check if the authenticated user is an Admin
  if (!isAdmin(requester)) {
    console.warn(`User ${requester.name} attempted to update team ${_id} but is not an Admin.`); // Log unauthorized attempt
    return res.status(403).send({ error: 'Admin access required to update teams.' }); // Send 403 Forbidden
  }

  // Allowed updates for a team
  const allowedUpdates = ['name', 'description', 'members', 'admin'];
  const updates = Object.keys(req.body);

  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    // Find the team by ID
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(404).send(); // Send 404 if team not found
    }

    // Apply updates
    for (const update of updates) {
        // Special handling for 'members' array to replace it
        if (update === 'members' && Array.isArray(req.body.members)) {
             const validMembers = [];
             for (const memberId of req.body.members) {
                 if (mongoose.Types.ObjectId.isValid(memberId)) {
                     const userExists = await User.exists({ _id: memberId });
                     if (userExists) {
                         validMembers.push(memberId);
                     } else {
                         console.warn(`Invalid member ID provided during team update: ${memberId}`);
                     }
                 } else {
                     console.warn(`Invalid ObjectId format for member ID during team update: ${memberId}`);
                 }
             }
            team.members = validMembers;
        }
        // Special handling for 'admin' to validate it's a valid User ID (optional, schema pre-save can also do this)
        else if (update === 'admin' && req.body.admin) {
             if (mongoose.Types.ObjectId.isValid(req.body.admin)) {
                 const adminUser = await User.findById(req.body.admin);
                 if (adminUser && adminUser.role === 'Admin') {
                     team.admin = req.body.admin;
                 } else {
                     console.warn(`Invalid or non-admin user ID provided for team admin: ${req.body.admin}`);
                     return res.status(400).send({ error: 'Assigned admin user must exist and have the Admin role.' });
                 }
             } else {
                 console.warn(`Invalid ObjectId format for team admin ID during team update: ${req.body.admin}`);
                 return res.status(400).send({ error: 'Invalid format for admin user ID.' });
             }
        }
        // For other allowed updates (name, description)
        else if (update !== 'members' && update !== 'admin') {
             team[update] = req.body[update];
        }
    }


    await team.save(); // Save the updated team

    // Populate the members and admin fields before sending the response
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'name email')
      .populate('admin', 'name email')
      .exec();


    res.send(populatedTeam); // Send back the updated team

  } catch (e) {
    console.error(`Error updating team by ID ${_id}:`, e); // Log the error
     // Handle duplicate team name error specifically
    if (e.code === 11000) { // MongoDB duplicate key error code
         return res.status(400).send({ error: 'Team name is already in use.' });
    }
    // Handle Mongoose validation errors
    if (e.name === 'ValidationError') {
         return res.status(400).send({ error: e.message });
    }
    res.status(400).send(e); // Send 400 for other errors
  }
};

// --- Controller function to delete a team by ID ---
// Protected by auth middleware. Requires Admin role.
// Export using export const
export const deleteTeam = async (req, res) => {
  const _id = req.params.id; // Get team ID from URL
  const requester = req.user; // The authenticated user (should be Admin)

  // Check if the authenticated user is an Admin
  if (!isAdmin(requester)) {
    console.warn(`User ${requester.name} attempted to delete team ${_id} but is not an Admin.`); // Log unauthorized attempt
    return res.status(403).send({ error: 'Admin access required to delete teams.' }); // Send 403 Forbidden
  }

  try {
    // Find and delete the team by ID
    const team = await Team.findByIdAndDelete(_id);

    if (!team) {
      return res.status(404).send(); // Send 404 if team not found
    }

    // Optional: Handle tasks assigned to this team if you add team assignment to tasks later
    // e.g., set team field on tasks to null, or reassign them.

    res.send({ message: 'Team deleted successfully', team }); // Send back deleted team info

  } catch (e) {
    console.error(`Error deleting team by ID ${_id}:`, e); // Log the error
    res.status(500).send(); // Send 500 for other errors
  }
};

// --- Controller function to add a member to a team ---
// Protected by auth middleware. Requires Admin role.
// Assumes request body contains { userId: '...' }
// Export using export const
export const addTeamMember = async (req, res) => {
    const _id = req.params.id; // Get team ID from URL
    const requester = req.user; // The authenticated user (should be Admin)
    const { userId } = req.body; // The ID of the user to add

    // Check if the authenticated user is an Admin
    if (!isAdmin(requester)) {
        console.warn(`User ${requester.name} attempted to add member to team ${_id} but is not an Admin.`);
        return res.status(403).send({ error: 'Admin access required to manage team members.' });
    }

    // Validate the provided user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ error: 'Invalid user ID provided.' });
    }

    try {
        // Find the team by ID
        const team = await Team.findById(_id);

        if (!team) {
            return res.status(404).send({ error: 'Team not found.' });
        }

        // Find the user to be added
        const userToAdd = await User.findById(userId);
        if (!userToAdd) {
             return res.status(404).send({ error: 'User to add not found.' });
        }

        // Check if the user is already a member
        if (team.members.map(id => id.toString()).includes(userId.toString())) {
            return res.status(400).send({ error: 'User is already a member of this team.' });
        }

        // Add the user to the members array
        team.members.push(userId);
        await team.save(); // Save the updated team

        // Populate the members and admin fields before sending the response
        const populatedTeam = await Team.findById(team._id)
          .populate('members', 'name email')
          .populate('admin', 'name email')
          .exec();


        res.send(populatedTeam); // Send back the updated team

    } catch (e) {
        console.error(`Error adding member ${userId} to team ${_id}:`, e);
        res.status(500).send();
    }
};

// --- Controller function to remove a member from a team ---
// Protected by auth middleware. Requires Admin role.
// Assumes request body contains { userId: '...' }
// Export using export const
export const removeTeamMember = async (req, res) => {
    const _id = req.params.id; // Get team ID from URL
    const requester = req.user; // The authenticated user (should be Admin)
    const { userId } = req.body; // The ID of the user to remove

    // Check if the authenticated user is an Admin
    if (!isAdmin(requester)) {
        console.warn(`User ${requester.name} attempted to remove member from team ${_id} but is not an Admin.`);
        return res.status(403).send({ error: 'Admin access required to manage team members.' });
    }

    // Validate the provided user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ error: 'Invalid user ID provided.' });
    }

    try {
        // Find the team by ID
        const team = await Team.findById(_id);

        if (!team) {
            return res.status(404).send({ error: 'Team not found.' });
        }

        // Find the index of the user in the members array
        const memberIndex = team.members.indexOf(userId);

        // Check if the user is a member
        if (memberIndex === -1) {
            return res.status(404).send({ error: 'User is not a member of this team.' });
        }

        // Remove the user from the members array
        team.members.splice(memberIndex, 1);
        await team.save(); // Save the updated team

        // Populate the members and admin fields before sending the response
        const populatedTeam = await Team.findById(team._id)
          .populate('members', 'name email')
          .populate('admin', 'name email')
          .exec();


        res.send(populatedTeam); // Send back the updated team

    } catch (e) {
        console.error(`Error removing member ${userId} from team ${_id}:`, e);
        res.status(500).send();
    }
};

// --- Controller function to get all teams where the user is a member ---
export const getMyTeams = async (req, res) => {
  try {
    console.log(`getMyTeams called for user: ${req.user.name} (${req.user._id})`); // ADDED: Log for clarity
    const teams = await Team.find({ members: req.user._id })
      .populate('members', 'name email')
      .populate('admin', 'name email')
      .sort({ name: 1 })
      .exec();
    res.send(teams);
  } catch (e) {
    console.error('Error fetching user teams:', e);
    res.status(500).send({ error: 'Failed to fetch your teams.' });
  }
};

// Removed the redundant export block at the end
// All functions intended for export are already exported using 'export const'
/*
export {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
};
*/
