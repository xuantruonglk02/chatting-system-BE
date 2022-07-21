const jwt = require('jsonwebtoken');

const User = require('../models/User');

function getUserId(req) {
  const token = req.headers['x-access-token'];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function userOnline(userId, socketId) {
  User.findById(userId, (error, user) => {
    if (error) {
      return console.log(error);
    }
    if (!user) {
      return;
    }

    user.socketId = socketId;
    user.save((error, newUser) => {
      if (error) {
        return console.log(error);
      }
    });
  });
}

function userOffline(socketId) {
  User.findOne({ socketId: socketId }, (error, user) => {
    if (error) {
      return console.log(error);
    }
    if (!user) {
      return;
    }

    user.lastOnline = new Date();
    user.socketId = '';
    user.save((error, newUser) => {
      if (error) {
        return console.log(error);
      }
    });
  });
}

module.exports = {
  getUserId,
  userOnline,
  userOffline
}
