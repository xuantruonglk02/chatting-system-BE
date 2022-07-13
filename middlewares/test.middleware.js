const { UNAUTHORIZED } = require("../config/HttpStatusCodes");

function pass(req, res, next) {
  next();
}

function fail(req, res, next) {
  return res.status(UNAUTHORIZED).json({
    success: 0,
    errorCode: 'an-error-code-from-ErrorCodes-file',
    redirect_to: '/login'
  });
}

module.exports = {
  pass,
  fail
}
