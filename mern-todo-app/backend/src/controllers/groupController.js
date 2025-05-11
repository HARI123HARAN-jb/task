import Group from '../models/Group.js';
import User from '../models/User.js';

// POST /api/groups
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Name and members are required.' });
    }
    // Ensure all members exist
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res.status(400).json({ error: 'One or more members not found.' });
    }
    // Add creator to members if not already included
    if (!members.includes(req.user._id.toString())) {
      members.push(req.user._id);
    }
    const group = new Group({
      name,
      members,
      createdBy: req.user._id
    });
    await group.save();
    res.status(201).json(group);
  } catch (e) {
    console.error('Create group error:', e);
    res.status(500).json({ error: 'Failed to create group.' });
  }
};

// GET /api/groups
export const getGroups = async (req, res) => {
  try {
    // Find groups where user is a member
    const groups = await Group.find({ members: req.user._id });
    res.json(groups);
  } catch (e) {
    console.error('Get groups error:', e);
    res.status(500).json({ error: 'Failed to fetch groups.' });
  }
};

export default { createGroup, getGroups }; 