const mongoose = require('./database');
const { Schema } = mongoose;

const conversationSchema = new Schema({
  userIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
