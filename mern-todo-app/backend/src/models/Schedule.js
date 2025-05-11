// backend/src/models/Schedule.js
import mongoose from 'mongoose';

// Schema for individual schedule blocks (no user reference here, as they are part of a Schedule document)
const ScheduleBlockSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] // Example days
    },
    startTime: { // Store time as a string or number (e.g., "09:00" or 540 for 9:00 AM minutes)
        type: String,
        required: true,
        trim: true
    },
    endTime: { // Store time as a string or number
        type: String,
        required: true,
        trim: true
    },
    activity: { // e.g., "Online Lecture", "Study Session", "Meeting"
        type: String,
        required: true,
        trim: true
    },
    location: { // Optional: e.g., "Zoom Link", "Library", "Home Office"
        type: String,
        trim: true
    },
    tag: { // Optional: Added 'tag' to block schema for flexible categorization
         type: String,
         trim: true
    }
    // Could add a reference to a course model later if needed
    // course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
});


// Main Schedule Schema - represents a collection of blocks, potentially for a specific period (e.g., semester)
const ScheduleSchema = new mongoose.Schema({
  user: { // New field to link this schedule to a specific user
    type: mongoose.Schema.Types.ObjectId, // Specifies that this field will store a MongoDB ObjectId
    required: true, // Every schedule must be associated with a user
    ref: 'User' // Tells Mongoose that this ObjectId refers to a document in the 'User' collection
  },
  name: { // e.g., "Spring Term Schedule", "Weekly Commitments"
    type: String,
    required: true,
    trim: true,
    default: 'My Weekly Schedule'
  },
  description: { // Optional description
    type: String,
    trim: true
  },
  uploadDate: { // Or creation date
      type: Date,
      default: Date.now
  },
  // An array of schedule blocks
  blocks: [ScheduleBlockSchema] // Embedding the block schema as an array
});

const Schedule = mongoose.model('Schedule', ScheduleSchema); // Create the Mongoose model

export default Schedule; // Export the model