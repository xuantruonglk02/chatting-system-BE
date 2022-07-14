const cors = require('cors');
const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const dotenv = require('dotenv').config();

// connect to database
const mongoose = require('./models/database');

const testRouter = require('./routes/test.router');
const { NOT_FOUND, UNKNOWN } = require('./config/HttpStatusCodes');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cors());

// routing
app.use('/test', testRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(NOT_FOUND));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || UNKNOWN);
  res.json({ success: 0 });
});

// test models
// const EmailRegistration = require('./models/EmailRegistration');
// new EmailRegistration({
//   email: 'xuantruonglk02@gmail.com',
//   code: 123456,
//   token: 'token',
//   expireAt: new Date(new Date().getTime() + (3*60*1000))
// })
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((error) => {
//     console.log(error);
//   });

module.exports = app;
