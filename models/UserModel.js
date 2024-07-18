const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  businessType: { type: String, required: true },
  agreeToTerms: { type: Boolean, required: true },
  role: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    default: null 
  },
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
