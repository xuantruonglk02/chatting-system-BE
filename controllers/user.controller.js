const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('mongoose');

const { BAD_REQUEST, UNKNOWN } = require('../config/HttpStatusCodes');
const User = require('../models/User');
const { Conversation } = require('../models/Conversation');

const getUserId = (req) => {
  const token = req.headers['x-access-token'];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
    
  } catch (error) {
    throw error;
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

const getConversationIdsOfUser = (userId, callback) => {
  if (!isValidObjectId(userId)) {
    return;
  }

  Conversation.find({ userIds: userId }, (error, conversations) => {
    if (error) {
      return console.log(error);
    }
    const conversationIds = conversations.map(conversation => conversation._id.toString()) || [];
    callback(conversationIds);
  });
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

const getSocketIds = async (userIds) => {
  try {
    const users = await User.find({
      _id: { $in: userIds }
    });
    return users.map(user => user.socketId) || [];

  } catch (error) {
    throw error;
  }
}

const getUserOnlineStatuses = async (req, res) => {
  if (!req.body.userIds || !Array.isArray(req.body.userIds)
    || isNaN(req.body.begin) || isNaN(req.body.limit)) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const users = await User.find({
      _id: { $in: req.body.userIds }
    })
      .select('_id lastOnline')
      .skip(req.body.begin)
      .limit(req.body.limit);

    return res.json({ success: 1, users: users });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

module.exports = {
  getUserId,
  userOnline,
  getConversationIdsOfUser,
  userOffline,
  getSocketIds,
  getUserOnlineStatuses
}
