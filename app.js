const cors = require('cors');
const createError = require('http-errors');
const ejs = require('ejs');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const dotenv = require('dotenv').config();

// connect to database
const mongoose = require('./models/database');

const { NOT_FOUND, UNKNOWN } = require('./config/HttpStatusCodes');
const authRouter = require('./routes/auth.router');
const messageRouter = require('./routes/message.router');
const userRouter = require('./routes/user.router');
const conversationRouter = require('./routes/conversation.router');

const testRouter = require('./routes/test.router');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// routing
app.use('/auth', authRouter);
app.use('/message', messageRouter);
app.use('/user', userRouter);
app.use('/conversation', conversationRouter);

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

module.exports = app;
