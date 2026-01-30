const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({
  donorEmail: String,
  donorPhone: String, // Encrypted Field
  amount: Number,
  purpose: String,
  status: String,
  dataHash: String, // integrity check
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Donation", DonationSchema);
