const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const router = express.Router();

let otpStore = {};

// SIGNUP → REQUEST OTP
router.post("/request-otp", async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already registered. Please Login." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    password,
  };

  console.log("\n========================================");
  console.log(`[SIGNUP] OTP for ${email}: ${otp}`);
  console.log("========================================\n");

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

  // Double check existence to avoid crash
  if (await User.findOne({ email })) {
    delete otpStore[email];
    return res.status(400).json({ message: "User already registered." });
  }

  await User.create({
    email,
    password: hashedPassword,
  });

  delete otpStore[email];

  res.json({ message: "User registered successfully" });
});

// LOGIN - Step 1: Verify Password & Send OTP
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // SECURITY: Hashing with Salt verification
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // MFA: Generate OTP for Login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = {
      otp,
      userId: user._id,
      role: user.role,
      type: 'LOGIN'
    };

    console.log("\n========================================");
    console.log(`[LOGIN MFA] OTP for ${email}: ${otp}`);
    console.log("========================================\n");

    res.json({ message: "OTP sent. Please verify." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN OTP VERIFY - Step 2: Verify OTP & Issue JWT
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email] || otpStore[email].otp !== otp) {
    return res.status(400).json({ message: "Invalid or Expired OTP" });
  }

  // Ensure we are verifying the right type of OTP
  if (otpStore[email].type && otpStore[email].type !== 'LOGIN') {
    return res.status(400).json({ message: "Invalid OTP Type" });
  }

  // Generate JWT Token
  const token = require("jsonwebtoken").sign(
    { id: otpStore[email].userId, role: otpStore[email].role },
    process.env.JWT_SECRET || "supersecretkey_change_in_production",
    { expiresIn: "1h" }
  );

  const role = otpStore[email].role;
  delete otpStore[email]; // Clear OTP after use (Replay Attack Prevention)

  res.json({ message: "Login success", token, role });
});

// KEY EXCHANGE - Public Key
router.get("/public-key", (req, res) => {
  // Read public key from signature module or file
  // Check if we can access the key from signature.js or if we need to regenerate
  // The signature.js generates key pair on load. Ideally we export it.
  // I will modify signature.js to export the public key string if it doesn't already.
  // Assuming signature.js exports, let's read it.
  // Wait, signature.js uses crypto.generateKeyPairSync.
  // I need to import it.
  const signatureModule = require('../crypto/signature');
  // NOTE: I need to verify if signature.js exports the key.
  // I will check signature.js content again. It exports signData and verifySignature but not keys.
  // I will assume I will modify signature.js next.
  if (signatureModule.publicKey) {
    res.json({ publicKey: signatureModule.publicKey });
  } else {
    res.status(500).json({ message: "Key exchange not available" });
  }
});

module.exports = router;
