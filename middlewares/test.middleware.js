const { UNAUTHORIZED } = require("../config/http-status-codes");

function pass(req, res, next) {
  next();
}

function fail(req, res, next) {
  return res.status(UNAUTHORIZED).json({
    success: 0,
    redirect_to: '/login'
  });
}

module.exports = {
  pass,
  fail
}
