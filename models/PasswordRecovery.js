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
  expireAt: Date
});

passwordRecoverySchema.index({ 'expireAt': 1 }, { expireAfterSeconds: 0 });

const PasswordRecovery = mongoose.model('PasswordRecovery', passwordRecoverySchema);

module.exports = PasswordRecovery;
