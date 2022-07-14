const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const { BAD_REQUEST, UNKNOWN, UNAUTHORIZED } = require('../config/HttpStatusCodes');
const { EMAIL_INVALID, EMAIL_INCORRECT, PASSWORD_INCORRECT } = require('../config/ErrorCodes');
const User = require('../models/User');

function login(req, res) {
  if (!req.body.email || !req.body.password) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorCode: EMAIL_INVALID });
  }

  User.findOne({ email: req.body.email }, async (error, user) => {
    if (error) {
      return res.status(UNKNOWN).json({ success: 0 });
    }
    if (!user) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorCode: EMAIL_INCORRECT });
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorCode: PASSWORD_INCORRECT });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: 24 * 60 * 60 * 1000 });
    return res.json({
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      accessToken: token
    });
  });
}

module.exports = {
  login
}
