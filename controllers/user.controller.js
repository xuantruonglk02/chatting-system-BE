const jwt = require('jsonwebtoken');

const User = require('../models/User');

const getUserId = (req) => {
  const token = req.headers['x-access-token'];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

const userOnline = async (userId, socketId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return;
    }
    user.socketId = socketId;
    user.save((error) => {});
  
  } catch (error) {
    return console.log(error);
  }
}

const userOffline = async (socketId) => {
  try {
    const user = await User.findOne({ socketId: socketId });
    if (!user) {
      return;
    }
    user.lastOnline = new Date();
    user.socketId = '';
    user.save((error) => {});

  } catch (error) {
    return console.log(error);
  }
}

module.exports = {
  getUserId,
  userOnline,
  userOffline
}
