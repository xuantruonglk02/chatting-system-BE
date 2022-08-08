const mongoose = require('./database');
const { Schema } = mongoose;

const messageSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  content: String,
  attachments: {
    type: { type: String },
    urls: [
      { type: String }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
