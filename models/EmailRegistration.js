const mongoose = require('./database');
const { Schema } = mongoose;

const emailRegistrationSchema = new Schema({
  email: String,
  code: Number,
  token: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600
  }
});

const EmailRegistration = mongoose.model('EmailRegistration', emailRegistrationSchema);

module.exports = EmailRegistration;
