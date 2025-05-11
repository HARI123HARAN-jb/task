// backend/models/Team.js
// Team Mongoose model for the Team Task Manager, using ES Modules.

import mongoose from 'mongoose'; // Import mongoose using ES module syntax
import User from './User.js'; // Import User model using ES module syntax (ensure User.js is also ES module)

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true // Team names should likely be unique
    },
    description: {
        type: String,
        trim: true
    },
    // Array of references to User documents who are members of this team
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // References the User model
    }],
    // Reference to the Admin user who created/manages this team (optional, depending on your team structure)
    // You might have one Admin managing multiple teams, or each team having a designated Admin member.
    // Let's add a simple 'admin' field referencing a User who is an Admin.
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
        required: false // Make it optional for now, can enforce later
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Optional: Add a pre-save hook to ensure the 'admin' field references a user with the 'Admin' role
// teamSchema.pre('save', async function(next) {
//     const team = this;
//     if (team.isModified('admin') && team.admin) {
//         const adminUser = await mongoose.model('User').findById(team.admin);
//         if (!adminUser || adminUser.role !== 'Admin') {
//             return next(new Error('Assigned admin user must have the Admin role.'));
//         }
//     }
//     next();
// });


const Team = mongoose.model('Team', teamSchema); // Create the Mongoose model named 'Team'

// Export the model using ES module syntax as the default export
export default Team;
