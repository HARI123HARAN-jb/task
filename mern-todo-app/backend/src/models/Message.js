import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.group; }
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false
  },
  content: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

const Message = mongoose.model('Message', messageSchema);
export default Message; 