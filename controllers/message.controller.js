const { isValidObjectId } = require('mongoose');

const { BAD_REQUEST, UNKNOWN } = require('../config/HttpStatusCodes');
const { sendMessage } = require('../services/socket/socketEmiter');
const Message = require('../models/Message');
const userController = require('./user.controller');
const roomController = require('./room.controller');

const getMessages = async (req, res) => {
  if (!req.query.to || !req.query.begin || !req.query.limit
    || !isValidObjectId(req.query.to)
    || isNaN(req.query.begin) || isNaN(req.query.limit)) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const userId = userController.getUserId(req);
    const messages = await Message.find({ from: userId, to: req.query.to })
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
    const isConversationId = await roomController.checkConversationId(req.body.to);
    const conversationId = isConversationId
      ? req.body.to
      : await roomController.createConversation([userId, req.body.to]);

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

    await roomController.setLastMessage(conversationId, message._id);

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
