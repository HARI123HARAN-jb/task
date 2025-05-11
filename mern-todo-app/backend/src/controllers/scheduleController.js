// backend/src/controllers/scheduleController.js
import Schedule from '../models/Schedule.js'; // Import Schedule model
import User from '../models/User.js'; // Import User model (needed for check)


// Get all schedules for the authenticated user
// GET /api/schedules
// Protected route - req.user will be available here from middleware
export const getSchedules = async (req, res) => {
    try {
        // Find all schedules where the 'user' field matches the ID of the authenticated user (req.user._id)
        const schedules = await Schedule.find({ user: req.user._id }).sort({ uploadDate: -1 });
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new schedule entry for the authenticated user
// POST /api/schedules
// Protected route - req.user will be available here from middleware
export const createSchedule = async (req, res) => {
    const { name, description, blocks } = req.body;

    // Basic validation for required fields if any
    if (!name) {
         return res.status(400).json({ message: 'Schedule name is required' });
    }

    // The user ID comes from the authenticated user attached to the request by the middleware (req.user._id)
    const schedule = new Schedule({
        user: req.user._id, // Associate the schedule with the authenticated user
        name,
        description,
        blocks: blocks || [] // Initialize with empty array if no blocks sent
    });

    try {
        const newSchedule = await schedule.save();
        res.status(201).json(newSchedule);
    } catch (error) {
        if (error.name === 'ValidationError') {
           return res.status(400).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

// Get a single schedule by ID (ensure ownership)
// GET /api/schedules/:id
// Protected route - req.user will be available here from middleware
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    // Check if the schedule exists
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // --- Security Check: Ensure the schedule belongs to the authenticated user ---
    // Convert schedule.user (which is an ObjectId) to a string for comparison with req.user._id (ObjectId)
    if (schedule.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to access this schedule' }); // Send Unauthorized if not owned by user
    }
    // --- End Security Check ---

    res.status(200).json(schedule);
  } catch (error) {
    // Handle invalid ID format or other errors
    res.status(500).json({ message: error.message });
  }
};

// Update a schedule (handles updating name, description, or replacing the entire blocks array) (ensure ownership)
// PATCH /api/schedules/:id
// Protected route - req.user will be available here from middleware
export const updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);

        // Check if the schedule exists
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // --- Security Check: Ensure the schedule belongs to the authenticated user ---
         if (schedule.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this schedule' }); // Send Unauthorized if not owned by user
        }
        // --- End Security Check ---


        // Apply updates from the request body if they exist
        if (req.body.name !== undefined) schedule.name = req.body.name;
        if (req.body.description !== undefined) schedule.description = req.body.description;

        // If a new blocks array is provided in the request body, replace the existing one
        // Frontend will manage adding/removing/editing blocks locally and send the updated array via this route.
        if (req.body.blocks !== undefined) { // Use !== undefined to allow sending empty array
             // Basic validation for blocks if needed (e.g., check if it's an array)
             if (!Array.isArray(req.body.blocks)) {
                 return res.status(400).json({ message: 'Blocks must be an array' });
             }
             schedule.blocks = req.body.blocks;
        }

        const updatedSchedule = await schedule.save();
        res.status(200).json(updatedSchedule);

    } catch (error) {
        if (error.name === 'ValidationError') {
           return res.status(400).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

// Delete a schedule by ID (deletes the entire schedule document) (ensure ownership)
// DELETE /api/schedules/:id
// Protected route - req.user will be available here from middleware
export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    // Check if the schedule exists
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

     // --- Security Check: Ensure the schedule belongs to the authenticated user ---
    if (schedule.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this schedule' }); // Send Unauthorized if not owned by user
    }
    // --- End Security Check ---


    // Delete the schedule document
    await Schedule.findByIdAndDelete(req.params.id); // Or use Schedule.deleteOne({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};