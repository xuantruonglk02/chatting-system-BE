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

const createConversation = async (userIds, type = ConversationType.PTP) => {
  if ((type !== ConversationType.PTP && type !== ConversationType.PTG)
    || !Array.isArray(userIds)
    || userIds.length > 50
    || (type === ConversationType.PTP && userIds.length !== 2)
    || (type === ConversationType.PTG && userIds.length < 3)) {
    return null;
  }
  const allAreObjectId = userIds.every(id => isValidObjectId(id));
  if (!allAreObjectId) {
    return null;
  }

  try {
    const conversation = await new Conversation({
      type: type,
      userIds: userIds
    }).save();
    
    const socketIds = await userController.getSocketIds(userIds);
    addSocketsToRoom(conversation._id, socketIds);
    
    return conversation._id;

  } catch (error) {
    throw error;
  }
}

const clientCreateConversation = async (req, res) => {
  if (!req.body.userIds || !Array.isArray(req.body.userIds)
    || req.body.userIds.length < 3 || req.body.userIds.length > 50) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const conversationId = await createConversation(req.body.userIds, ConversationType.PTG);
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

module.exports = {
  checkConversationId,
  createConversation,
  clientCreateConversation,
  getConversationIdsOfUser,
  setLastMessage
}
