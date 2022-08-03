const { isValidObjectId } = require('mongoose');

const { BAD_REQUEST, UNKNOWN } = require('../config/HttpStatusCodes');
const { sendMessage } = require('../services/socket/socketEmiter');
const Message = require('../models/Message');
const { ConversationType } = require('../models/Conversation');
const userController = require('./user.controller');
const conversationController = require('./conversation.controller');

const getMessages = async (req, res) => {
  if (!req.query.conversationId || !isValidObjectId(req.query.conversationId)
    || isNaN(req.query.begin) || isNaN(req.query.limit)) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const messages = await Message.find({ to: req.query.conversationId })
      .select('_id from to content attach createdAt')
      .populate({
        path: 'from',
        select: '_id name avataUrl'
      })
      .sort({ createdAt: -1 })
      .skip(req.query.begin)
      .limit(req.query.limit);

    return res.json({ success: 1, messages: messages });
    
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    return console.log(error);
  }
}

const clientSendMessage = async (req, res) => {
  if (!req.body.to || !req.body.content
    || !isValidObjectId(req.body.to)) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const userId = userController.getUserId(req);
    const isConversationId = await conversationController.checkConversationId(req.body.to);
    const conversationId = isConversationId
      ? req.body.to
      : await conversationController.createConversation({
        userIds: [userId, req.body.to],
        type: ConversationType.PTP,
        title: ''
      });

    const message = await new Message({
      from: userId,
      to: conversationId,
      content: req.body.content
    }).save();

    sendMessage(conversationId.toString(), {
      from: userId,
      to: conversationId,
      content: message.content
    });

    await conversationController.setLastMessage(conversationId, message._id);

    return res.json({ success: 1 });
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    return console.log(error);
  }
}

module.exports = {
  getMessages,
  clientSendMessage
}
