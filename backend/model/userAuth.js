const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date }, // OTP expiration time
  linkedCards: [{ type: String }], // For storing linked debit/credit cards
  spendingLimit: { type: Number }, // Spending limit for cards
  // Add other fields related to expenses and trends as required
});

var user = mongoose.model("Authentication", userSchema);
module.exports = user;
