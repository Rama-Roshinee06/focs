const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const router = express.Router();

let otpStore = {};

// SIGNUP → REQUEST OTP
router.post("/request-otp", (req, res) => {
  const { email, password } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    password,
  };

  console.log("Signup OTP:", otp); // demo purpose

  res.json({ message: "OTP sent" });
});

// SIGNUP → VERIFY OTP
router.post("/verify-signup", async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email] || otpStore[email].otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const hashedPassword = await bcrypt.hash(
    otpStore[email].password,
    10
  );

  await User.create({
    email,
    password: hashedPassword,
  });

  delete otpStore[email];

  res.json({ message: "User registered successfully" });
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const otp = "123456"; // demo OTP
  otpStore[email] = { otp };

  res.json({ otp });
});

// LOGIN OTP VERIFY
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email] || otpStore[email].otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  res.json({ message: "Login success" });
});

module.exports = router;
