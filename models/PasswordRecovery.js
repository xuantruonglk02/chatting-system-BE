const mongoose = require('./database');
const { Schema } = mongoose;

const passwordRecoverySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  email: String,
  code: Number,
  token: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600
  }
});

const PasswordRecovery = mongoose.model('PasswordRecovery', passwordRecoverySchema);

module.exports = PasswordRecovery;
