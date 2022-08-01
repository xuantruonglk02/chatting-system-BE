const { isValidObjectId } = require('mongoose');

const { UNKNOWN, BAD_REQUEST } = require('../config/HttpStatusCodes');
const { addSocketsToRoom } = require('../services/socket/socketio');
const { Conversation, ConversationType } = require('../models/Conversation');
const userController = require('./user.controller');

const checkConversationId = async (id) => {
  if (!isValidObjectId(id)) {
    return false;
  }

  try {
    const conversation = await Conversation.findById(id);
    if (conversation) {
      return true;
    }
    return false;

  } catch (error) {
    throw error;
  }
}

const createConversation = async (data) => {
  if ((data.type !== ConversationType.PTP && data.type !== ConversationType.PTG)
    || !Array.isArray(data.userIds)
    || data.userIds.length > 50
    || (data.type === ConversationType.PTP && data.userIds.length !== 2)
    || (data.type === ConversationType.PTG && data.userIds.length < 3)) {
    return null;
  }
  const allAreObjectId = data.userIds.every(id => isValidObjectId(id));
  if (!allAreObjectId) {
    return null;
  }

  try {
    const conversation = await new Conversation(data).save();
    
    const socketIds = await userController.getSocketIds(data.userIds);
    addSocketsToRoom(conversation._id, socketIds);
    
    return conversation._id;

  } catch (error) {
    throw error;
  }
}

const clientCreateConversation = async (req, res) => {
  if (!req.body.title
    || !req.body.userIds || !Array.isArray(req.body.userIds)
    || req.body.userIds.length < 3 || req.body.userIds.length > 50) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const conversationId = await createConversation({
      title: req.body.title,
      type: ConversationType.PTG,
      userIds: req.body.userIds
    });
    if (!conversationId) {
      return res.status(BAD_REQUEST).json({ success: 0 });
    }
    
    return res.json({ success: 1, conversationId: conversationId });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

const getConversationIdsOfUser = async (userId) => {
  if (!isValidObjectId(userId)) {
    return;
  }

  try {
    const conversations = await Conversation.find({
      userIds: userId
    });
    return conversations.map(conversation => conversation._id) || [];

  } catch (error) {
    throw error;
  }
}

const setLastMessage = async (conversationId, messageId) => {
  try {
    const conversation = await Conversation.findById(conversationId);
    conversation.lastMessage = messageId;
    conversation.lastActionTime = new Date();
    await conversation.save();

  } catch (error) {
    throw error;
  }
}

const getRecentConversations = async (req, res) => {
  if (isNaN(req.query.begin) || isNaN(req.query.limit)) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const userId = userController.getUserId(req);
    const conversations = await Conversation.find({ userIds: userId })
      .populate({
        path: 'lastMessage',
        select: '_id from content attach createdAt',
        populate: {
          path: 'from',
          select: '_id name avatarUrl'
        }
      })
      .sort({ lastActionTime: -1 })
      .skip(req.query.begin)
      .limit(req.query.limit);

    res.json({ success: 1, conversations: conversations });

  } catch (error) {
    console.log(error);
    return res.status(UNKNOWN).json({ success: 0 });
  }
}

module.exports = {
  checkConversationId,
  createConversation,
  clientCreateConversation,
  getConversationIdsOfUser,
  setLastMessage,
  getRecentConversations
}
