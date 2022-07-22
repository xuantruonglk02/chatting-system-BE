const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { randomBytes } = require('node:crypto');

const { BAD_REQUEST, UNKNOWN, UNAUTHORIZED, CONFLICT } = require('../config/HttpStatusCodes');
const { EMAIL_INVALID, EMAIL_INCORRECT, PASSWORD_INCORRECT, EMAIL_EXISTS, EMAIL_ERROR, TOKEN_INCORRECT, TOKEN_EXPIRED, REPASSWORD_INCORRECT } = require('../config/ErrorMessages');
const { transporter, verificationEmailOptions, resetPasswordEmailOptions } = require('../services/mailer/nodemailer');
const User = require('../models/User');
const EmailRegistration = require('../models/EmailRegistration');
const PasswordRecovery = require('../models/PasswordRecovery');

const login = async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: EMAIL_INVALID });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorMessage: EMAIL_INCORRECT });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorMessage: PASSWORD_INCORRECT });
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
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 })
    throw error;
  }
}

const registerEmail = async (req, res) => {
  if (!req.body.email) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: EMAIL_INVALID });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(CONFLICT).json({ success: 0, errorMessage: EMAIL_EXISTS });
    }

    const token = randomBytes(60).toString('hex');
    EmailRegistration.deleteMany({ email: req.body.email }, (error) => {});
    const emailRegistration = new EmailRegistration({
      email: req.body.email,
      token: token
    });
    await emailRegistration.save();

    await transporter.sendMail(verificationEmailOptions(emailRegistration.email, emailRegistration.token));
    
    return res.json({ success: 1 });
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    throw error;
  }
}

const checkEmailRegistrationToken = async (req, res) => {
  if (!req.query.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const emailRegistration = await EmailRegistration.findOne({ token: req.query.token });
    if (!emailRegistration) {
      return res.status(BAD_REQUEST).json({ success: 0, errorMessage: TOKEN_INCORRECT });
    }
    if (new Date().getTime() - emailRegistration.createdAt.getTime() > parseInt(process.env.EMAIL_EXPIRATION_TIME)) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorMessage: TOKEN_EXPIRED });
    }

    return res.json({ success: 1, email: emailRegistration.email });
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    throw error;
  }
}

const createAccount = async (req, res) => {
  if (!req.body.email || !req.body.name || !req.body.password || !req.body.repassword || !req.body.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: EMAIL_INVALID });
  }
  if (req.body.password !== req.body.repassword) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: REPASSWORD_INCORRECT });
  }

  try {
    const emailRegistration = await EmailRegistration.findOne({ email: req.body.email, token: req.body.token });
    if (!emailRegistration) {
      return res.status(BAD_REQUEST).json({ success: 0, errorMessage: [EMAIL_INCORRECT, TOKEN_INCORRECT] });
    }

    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(CONFLICT).json({ success: 0, errorMessage: EMAIL_EXISTS });
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.HASH_ROUND));
    const hash = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hash
    });
    await newUser.save();

    EmailRegistration.deleteMany({ email: req.body.email }, (error) => {});

    return res.json({ success: 1 });
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    throw error;
  }
}

const verifyEmailForPasswordRecovering = async (req, res) => {
  if (!req.body.email) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: EMAIL_INVALID });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorMessage: EMAIL_INCORRECT });
    }

    const token = randomBytes(60).toString('hex');
    PasswordRecovery.deleteMany({ email: req.body.email }, (error) => {});
    const passwordRecovery = new PasswordRecovery({
      userId: user._id,
      email: req.body.email,
      token: token
    });
    await passwordRecovery.save();

    await transporter.sendMail(resetPasswordEmailOptions(passwordRecovery.email, passwordRecovery.token));
    
    return res.json({ success: 1 });
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    throw error;
  }
}

const checkPasswordRecoveryToken = async (req, res) => {
  if (!req.query.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }

  try {
    const passwordRecovery = await PasswordRecovery.findOne({ token: req.query.token });
    if (!passwordRecovery) {
      return res.status(BAD_REQUEST).json({ success: 0, errorMessage: TOKEN_INCORRECT });
    }
    if (new Date().getTime() - passwordRecovery.createdAt.getTime() > parseInt(process.env.PASSWORD_EXPIRATION_TIME)) {
      return res.status(UNAUTHORIZED).json({ success: 0, errorMessage: TOKEN_EXPIRED });
    }
    
    return res.json({ success: 1, email: passwordRecovery.email });
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    throw error;
  }
}

const resetPassword = async (req, res) => {
  if (!req.body.email || !req.body.password || !req.body.repassword || !req.body.token) {
    return res.status(BAD_REQUEST).json({ success: 0 });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: EMAIL_INVALID });
  }
  if (req.body.password !== req.body.repassword) {
    return res.status(BAD_REQUEST).json({ success: 0, errorMessage: REPASSWORD_INCORRECT });
  }

  try {
    const passwordRecovery = await PasswordRecovery.findOne({ email: req.body.email, token: req.body.token });
    if (!passwordRecovery) {
      return res.status(BAD_REQUEST).json({ success: 0, errorMessage: [EMAIL_INCORRECT, TOKEN_INCORRECT] });
    }

    const user = await User.findById(passwordRecovery.userId);
    if (!user) {
      return res.status(UNKNOWN).json({ success: 0 });
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.HASH_ROUND));
    const hash = await bcrypt.hash(req.body.password, salt);
    user.password = hash;
    await user.save();

    PasswordRecovery.deleteMany({ email: req.body.email }, (error) => {});

    return res.json({ success: 1 });
  
  } catch (error) {
    res.status(UNKNOWN).json({ success: 0 });
    throw error;
  }
}

module.exports = {
  login,
  registerEmail,
  checkEmailRegistrationToken,
  createAccount,
  verifyEmailForPasswordRecovering,
  checkPasswordRecoveryToken,
  resetPassword
}
