const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { randomBytes } = require('node:crypto');

const { BAD_REQUEST, UNKNOWN, UNAUTHORIZED, CONFLICT } = require('../config/HttpStatusCodes');
const { EMAIL_INVALID, EMAIL_INCORRECT, PASSWORD_INCORRECT, EMAIL_EXISTS, EMAIL_ERROR } = require('../config/ErrorCodes');
const { transporter, verificationEmailOptions } = require('../services/nodemailer');
const User = require('../models/User');
const EmailRegistration = require('../models/EmailRegistration');

function login(req, res) {
  if (!req.body.email || !req.body.password) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorCode: EMAIL_INVALID });
  }

  User.findOne({ email: req.body.email }, async (error, user) => {
    if (error) {
      console.log(error);
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
      success: 1,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      accessToken: token
    });
  });
}

function registerEmail(req, res) {
  if (!req.body.email) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorCode: EMAIL_INVALID });
  }

  User.findOne({ email: req.body.email }, (error, user) => {
    if (error) {
      console.log(error);
      return res.status(UNKNOWN).json({ success: 0 });
    }
    if (user) {
      return res.status(CONFLICT).json({ success: 0, errorCode: EMAIL_EXISTS });
    }

    randomBytes(60, (error, buffer) => {
      if (error) {
        console.log(error);
        return res.status(UNKNOWN).json({ success: 0 });
      }

      EmailRegistration.deleteMany({ email: req.body.email }, (error) => {});

      const token = buffer.toString('hex');
      new EmailRegistration({
        email: req.body.email,
        token: token
      }).save((error, doc) => {
        if (error) {
          console.log(error);
          return res.status(UNKNOWN).json({ success: 0 });
        }

        transporter.sendMail(verificationEmailOptions(doc.email, doc.token), (error, info) => {
          if (error) {
            console.log(error);
            return res.status(UNKNOWN).json({ success: 0, errorCode: EMAIL_ERROR });
          }

          return res.json({ success: 1 });
        });
      });
    });
  });
}

module.exports = {
  login,
  registerEmail
}
