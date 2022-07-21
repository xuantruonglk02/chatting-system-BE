const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { randomBytes } = require('node:crypto');

const { BAD_REQUEST, UNKNOWN, UNAUTHORIZED, CONFLICT } = require('../config/HttpStatusCodes');
const { EMAIL_INVALID, EMAIL_INCORRECT, PASSWORD_INCORRECT, EMAIL_EXISTS, EMAIL_ERROR, TOKEN_INCORRECT, TOKEN_EXPIRED, REPASSWORD_INCORRECT } = require('../config/ErrorCodes');
const { transporter, verificationEmailOptions, resetPasswordEmailOptions } = require('../services/mailer/nodemailer');
const User = require('../models/User');
const EmailRegistration = require('../models/EmailRegistration');
const PasswordRecovery = require('../models/PasswordRecovery');

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
      userId: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      accessToken: token,
      redirectTo: ''
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

function getCreateAccountPage(req, res) {
  if (!req.query.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  EmailRegistration.findOne({ token: req.query.token }, (error, doc) => {
    if (error) {
      console.log(error);
      return res.status(UNKNOWN).json({ success: 0 });
    }
    if (!doc) {
      return res.status(BAD_REQUEST).json({ success: 0, errorCode: TOKEN_INCORRECT });
    }
    if (new Date().getTime() - doc.createdAt.getTime() > parseInt(process.env.EMAIL_EXPIRATION_TIME)) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorCode: TOKEN_EXPIRED });
    }
    
    return res.json({ success: 1, email: doc.email });
  });
}

function createAccount(req, res) {
  if (!req.body.email || !req.body.name || !req.body.password || !req.body.repassword || !req.body.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorCode: EMAIL_INVALID });
  }
  if (req.body.password !== req.body.repassword) {
    return res.status(BAD_REQUEST).json({ success: 0, errorCode: REPASSWORD_INCORRECT });
  }

  EmailRegistration.findOne({ email: req.body.email, token: req.body.token }, (error, doc) => {
    if (error) {
      console.log(error);
      return res.status(UNKNOWN).json({ success: 0 });
    }
    if (!doc) {
      return res.status(BAD_REQUEST).json({ success: 0, errorCode: [EMAIL_INCORRECT, TOKEN_INCORRECT] });
    }

    User.findOne({ email: req.body.email }, async (error, user) => {
      if (error) {
        console.log(error);
        return res.status(UNKNOWN).json({ success: 0 });
      }
      if (user) {
        return res.status(CONFLICT).json({ success: 0, errorCode: EMAIL_EXISTS });
      }

      const salt = await bcrypt.genSalt(parseInt(process.env.HASH_ROUND));
      const hash = await bcrypt.hash(req.body.password, salt);
      new User({
        name: req.body.name,
        email: req.body.email,
        password: hash
      }).save((error, newUser) => {
        if (error) {
          console.log(error);
          return res.status(UNKNOWN).json({ success: 0 });
        }

        EmailRegistration.deleteMany({ email: req.body.email }, (error) => {});
        return res.json({ success: 1 });
      });
    });
  });
}

function verifyEmailForPasswordRecovering(req, res) {
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
    if (!user) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorCode: EMAIL_INCORRECT });
    }

    randomBytes(60, (error, buffer) => {
      if (error) {
        console.log(error);
        return res.status(UNKNOWN).json({ success: 0 });
      }

      PasswordRecovery.deleteMany({ email: req.body.email }, (error) => {});

      const token = buffer.toString('hex');
      new PasswordRecovery({
        userId: user._id,
        email: req.body.email,
        token: token
      }).save((error, doc) => {
        if (error) {
          console.log(error);
          return res.status(UNKNOWN).json({ success: 0 });
        }

        transporter.sendMail(resetPasswordEmailOptions(doc.email, doc.token), (error, info) => {
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

function getResetPasswordPage(req, res) {
  if (!req.query.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  PasswordRecovery.findOne({ token: req.query.token }, (error, doc) => {
    if (error) {
      console.log(error);
      return res.status(UNKNOWN).json({ success: 0 });
    }
    if (!doc) {
      return res.status(BAD_REQUEST).json({ success: 0, errorCode: TOKEN_INCORRECT });
    }
    if (new Date().getTime() - doc.createdAt.getTime() > parseInt(process.env.PASSWORD_EXPIRATION_TIME)) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorCode: TOKEN_EXPIRED });
    }
    
    return res.json({ success: 1, email: doc.email });
  });
}

function resetPassword(req, res) {
  if (!req.body.email || !req.body.password || !req.body.repassword || !req.body.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorCode: EMAIL_INVALID });
  }
  if (req.body.password !== req.body.repassword) {
    return res.status(BAD_REQUEST).json({ success: 0, errorCode: REPASSWORD_INCORRECT });
  }

  PasswordRecovery.findOne({ email: req.body.email, token: req.body.token }, (error, doc) => {
    if (error) {
      console.log(error);
      return res.status(UNKNOWN).json({ success: 0 });
    }
    if (!doc) {
      return res.status(BAD_REQUEST).json({ success: 0, errorCode: [EMAIL_INCORRECT, TOKEN_INCORRECT] });
    }

    User.findById(doc.userId, async (error, user) => {
      if (error || !user) {
        console.log(error);
        return res.status(UNKNOWN).json({ success: 0 });
      }

      const salt = await bcrypt.genSalt(parseInt(process.env.HASH_ROUND));
      const hash = await bcrypt.hash(req.body.password, salt);
      user.password = hash;
      user.save((error, user) => {
        if (error) {
          console.log(error);
          return res.status(UNKNOWN).json({ success: 0 });
        }

        PasswordRecovery.deleteMany({ email: req.body.email }, (error) => {});
        return res.json({ success: 1 });
      });
    });
  });
}

module.exports = {
  login,
  registerEmail,
  getCreateAccountPage,
  createAccount,
  verifyEmailForPasswordRecovering,
  getResetPasswordPage,
  resetPassword
}
