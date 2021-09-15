const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  resetToken: { type: String },
  activateToken: { type: String },
  expireToken: Date,
  isActivated: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);
