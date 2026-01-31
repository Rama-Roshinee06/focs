const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { encodeBase64 } = require("../crypto/encoding");

const router = express.Router();

let otpStore = {};

// MFA / OTP Utility (Simulated)
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * SIGNUP PHASE 1 - REQUEST OTP
 */
router.post("/request-otp", async (req, res) => {
  const { email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already registered. Please Login." });
  }

  const otp = generateOTP();
  otpStore[email] = {
    otp,
    password,
    role: role || "donor",
    type: 'SIGNUP'
  };

  console.log("\n[MFA SIMULATION] =======================");
  console.log(`TYPE: USER REGISTRATION`);
  console.log(`USER: ${email}`);
  console.log(`OTP:  ${otp}`);
  console.log("========================================\n");

  res.json({ message: "OTP sent to your email (simulated in console)" });
});

/**
 * SIGNUP PHASE 2 - VERIFY OTP & CREATE USER
 */
router.post("/verify-signup", async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email] || otpStore[email].otp !== otp || otpStore[email].type !== 'SIGNUP') {
    return res.status(400).json({ message: "Invalid or Expired OTP" });
  }

  // Securely Hash Password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(otpStore[email].password, salt);

  try {
    await User.create({
      email,
      password: hashedPassword,
      role: otpStore[email].role
    });

    delete otpStore[email];
    res.json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
});

/**
 * LOGIN PHASE 1 - AUTHENTICATE & SEND MFA OTP
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify Password Hash (Confidentiality of Identity)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid Credentials" });

    // Start MFA Flow
    const otp = generateOTP();
    otpStore[email] = {
      otp,
      userId: user._id,
      role: user.role,
      type: 'LOGIN'
    };

    console.log("\n[MFA SIMULATION] =======================");
    console.log(`TYPE: USER LOGIN`);
    console.log(`USER: ${email}`);
    console.log(`OTP:  ${otp}`);
    console.log("========================================\n");

    res.json({ message: "MFA Challenge: OTP sent to console." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN PHASE 2 - VERIFY OTP & ISSUE JWT
 */
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email] || otpStore[email].otp !== otp || otpStore[email].type !== 'LOGIN') {
    return res.status(400).json({ message: "Invalid or Expired OTP" });
  }

  // Generate JWT (Stateless Authentication)
  const token = require("jsonwebtoken").sign(
    { id: otpStore[email].userId, role: otpStore[email].role, email: email },
    process.env.JWT_SECRET || "supersecretkey_change_in_production",
    { expiresIn: "1h" }
  );

  const role = otpStore[email].role;
  delete otpStore[email]; // Prevent Replay Attacks

  res.json({
    message: "Login successful",
    token,
    role,
    // Add a demonstration of encoded data
    authContext: encodeBase64(JSON.stringify({ user: email, role: role, time: new Date() }))
  });
});

/**
 * TRUST ESTABLISHMENT - KEY EXCHANGE
 */
router.get("/public-key", (req, res) => {
  const signatureModule = require('../crypto/signature');
  if (signatureModule.publicKey) {
    res.json({ publicKey: signatureModule.publicKey });
  } else {
    res.status(500).json({ message: "Security module initializing..." });
  }
});

module.exports = router;

