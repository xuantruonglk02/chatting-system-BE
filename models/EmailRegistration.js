const mongoose = require('./database');
const { Schema } = mongoose;

const emailRegistrationSchema = new Schema({
  email: String,
  code: Number,
  token: String,
  expireAt: Date
});

emailRegistrationSchema.index({ 'expireAt': 1 }, { expireAfterSeconds: 0 });

const EmailRegistration = mongoose.model('EmailRegistration', emailRegistrationSchema);

module.exports = EmailRegistration;
