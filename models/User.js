const mongoose = require('./database');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  avatarUrl: String,
  lastOnline: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;
