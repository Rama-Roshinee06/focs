const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,   // HASHED ONLY
  role: { type: String, default: "donor" }
});

module.exports = mongoose.model("User", userSchema);
