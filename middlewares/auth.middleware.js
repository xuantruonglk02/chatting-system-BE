const jwt = require('jsonwebtoken');
const { UNAUTHORIZED } = require('../config/HttpStatusCodes');

function verifyToken(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(UNAUTHORIZED).json({ success: 0, redirectTo: '/auth/login' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(UNAUTHORIZED).json({ success: 0, redirect: '/auth/login' });
    }

    next();
  });
}

module.exports = {
  verifyToken
}
