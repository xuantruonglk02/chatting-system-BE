const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { isValidObjectId } = require('mongoose');

const { BAD_REQUEST, UNKNOWN, UNAUTHORIZED } = require('../config/HttpStatusCodes');
const { PASSWORD_INCORRECT, REPASSWORD_INCORRECT } = require('../config/ErrorMessages');
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

const getUserProfile = async (userId, args) => {
  try {
    const user = await User.findById(userId).select(args.join(' '));
    return user;

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

const getUserOnlineStatuses = async (req, res) => {
  if (!req.body.userIds || !Array.isArray(req.body.userIds)
    || isNaN(req.body.begin) || isNaN(req.body.limit)) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const users = await User.find({
      _id: { $in: req.body.userIds }
    })
      .select('_id socketId lastOnline')
      .skip(req.body.begin)
      .limit(req.body.limit);

    const returnUsers = users.map((user) => {
      return {
        _id: user._id,
        status: user.socketId ? 'online' : 'offline',
        lastOnline: user.lastOnline
      }
    });
    return res.json({ success: 1, users: returnUsers });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

const changeUserName = async (req, res) => {
  if (!req.body.newName || !req.body.password) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const userId = getUserId(req);
    const user = await User.findById(userId);

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorMessage: PASSWORD_INCORRECT });
    }

    user.name = req.body.newName;
    await user.save();

    return res.json({ success: 1 });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

const changeUserPassword = async (req, res) => {
  if (!req.body.newPassword || !req.body.reNewPassword || !req.body.password) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (req.body.newPassword !== req.body.reNewPassword) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: REPASSWORD_INCORRECT });
  }

  try {
    const userId = getUserId(req);
    const user = await User.findById(userId);

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorMessage: PASSWORD_INCORRECT });
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.HASH_ROUND));
    const hash = await bcrypt.hash(req.body.newPassword, salt);

    user.password = hash;
    await user.save();

    return res.json({ success: 1 });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

const changeUserAvatar = async (req, res) => {
  if (!req.body.newAvatarUrl) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const userId = getUserId(req);
    const user = await User.findById(userId);

    user.avatarUrl = req.body.newAvatarUrl;
    await user.save();

    return res.json({ success: 1 });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

const searchUserByKeyword = async (req, res) => {
  if (!req.query.keyword) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const userId = getUserId(req);
    const users = await User
      .find({
        _id: { $ne: userId },
        $or: [
          { name: new RegExp(req.query.keyword, 'i') },
          { email: req.query.keyword }
        ]
      })
      .select('_id name avatarUrl socketId lastOnline');

    const returnUsers = users.map((user) => {
      return {
        _id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        status: user.socketId ? 'online' : 'offline',
        lastOnline: user.lastOnline
      }
    });

    return res.json({ success: 1, users: returnUsers });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

const getOnlineUsers = async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversations = await Conversation
      .find({userIds: userId})
      .select('-_id userIds')
      .populate({
        path: 'userIds',
        match: {
          socketId: {
            $exists: true
          },
          $and: [
            { _id: { $ne: userId }},
            { socketId: { $ne: '' }}
          ]
        },
        select: '_id name avatarUrl'
      });

    const users = conversations.reduce((list, conversation) => {
      const usersNotInList = conversation.userIds.filter((user) => {
        return list.findIndex(userInList => userInList._id.toString() === user._id.toString()) === -1;
      });
      return list.concat(usersNotInList);
    }, []);

    return res.json({ success: 1, users: users });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

module.exports = {
  getUserId,
  getUserProfile,
  userOnline,
  userOffline,
  getSocketIds,
  getConversationIdsOfUser,
  getUserOnlineStatuses,
  changeUserName,
  changeUserPassword,
  changeUserAvatar,
  searchUserByKeyword,
  getOnlineUsers
}
