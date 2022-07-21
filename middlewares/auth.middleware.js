const jwt = require('jsonwebtoken');
const { UNAUTHORIZED } = require('../config/HttpStatusCodes');

function verifyToken(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(UNAUTHORIZED).json({ success: 0, redirectTo: '/auth/login' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      console.log(error)
      return res.status(UNAUTHORIZED).json({ success: 0, redirect: '/auth/login' });
    }
    if (decoded.exp < new Date().getTime() / 1000) {
      return res.status(UNAUTHORIZED).json({ success: 0, redirect: '/auth/login' });
    }
    next();
  });
}

module.exports = {
  verifyToken
}
