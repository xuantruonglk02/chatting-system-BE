const mongoose = require('./database');
const { Schema } = mongoose;

const roomSchema = new Schema({
  userIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
