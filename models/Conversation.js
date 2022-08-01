const mongoose = require('./database');
const { Schema } = mongoose;

const ConversationType = {
  PTP: 'ptp',
  PTG: 'ptg'
}

const conversationSchema = new Schema({
  type: {
    type: String,
    default: ConversationType.PTP
  },
  userIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActionTime: {
    type: Date,
    default: Date.now
  }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Conversation, ConversationType };
