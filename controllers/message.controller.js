const { isValidObjectId } = require('mongoose');

const userController = require('../controllers/user.controller');
const User = require('../models/User');
const Message = require('../models/Message');
const { sendMessage } = require('../services/socket/socketEmiter');
const { BAD_REQUEST, UNKNOWN } = require('../config/HttpStatusCodes');

function clientSendMessage(req, res) {
  if (!req.body.from || !req.body.to || !req.body.content) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!isValidObjectId(req.body.from) || !isValidObjectId(req.body.to)) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  new Message({
    from: req.body.from,
    to: req.body.to,
    content: req.body.content
  }).save((error, message) => {
    if (error) {
      console.log(error);
      return res.status(UNKNOWN).json({ success: 0 });
    }
    sendMessage(req.body);
    return res.json({ success: 1 });
  });
}

module.exports = {
  clientSendMessage
}
