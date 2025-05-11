import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

// POST /api/chat/send
export const sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    if (!receiver || !content) {
      return res.status(400).json({ error: 'Receiver and content are required.' });
    }
    // Check receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ error: 'Receiver not found.' });
    }
    const message = new Message({
      sender: req.user._id,
      receiver,
      content
    });
    await message.save();
    res.status(201).json({
      _id: message._id,
      sender: req.user._id,
      receiver,
      content,
      createdAt: message.createdAt
    });
  } catch (e) {
    console.error('Send message error:', e);
    res.status(500).json({ error: 'Failed to send message.' });
  }
};

// GET /api/chat/:userId
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    // Get all messages between req.user and userId
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) {
    console.error('Get messages error:', e);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

// POST /api/chat/group/:groupId/send
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }
    // Only allow members to send
    if (!group.members.map(id => id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ error: 'Not a group member.' });
    }
    const message = new Message({
      sender: req.user._id,
      group: groupId,
      content
    });
    await message.save();
    res.status(201).json({
      _id: message._id,
      sender: req.user._id,
      group: groupId,
      content,
      createdAt: message.createdAt
    });
  } catch (e) {
    console.error('Send group message error:', e);
    res.status(500).json({ error: 'Failed to send group message.' });
  }
};

// GET /api/chat/group/:groupId
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }
    // Only allow members to view
    if (!group.members.map(id => id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ error: 'Not a group member.' });
    }
    const messages = await Message.find({ group: groupId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) {
    console.error('Get group messages error:', e);
    res.status(500).json({ error: 'Failed to fetch group messages.' });
  }
};

// --- Controller to fetch all team chat messages for a team ---
export const getTeamChatMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const messages = await Message.find({ team: teamId })
      .sort({ createdAt: 1 })
      .select('content sender senderName createdAt')
      .populate('sender', 'name email')
      .exec();
    res.json(messages);
  } catch (e) {
    console.error('Get team chat messages error:', e);
    res.status(500).json({ error: 'Failed to fetch team chat messages.' });
  }
};

export default { sendMessage, getMessages, sendGroupMessage, getGroupMessages, getTeamChatMessages }; 