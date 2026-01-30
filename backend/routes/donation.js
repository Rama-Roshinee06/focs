const router = require("express").Router();
const Donation = require("../models/donation");

const auth = require("../middleware/auth");
const acl = require("../middleware/acl");
const { signData } = require("../crypto/signature");
const { encrypt, decrypt } = require("../crypto/encrypt");

// Create Donation - Protected & Signed
router.post("/create", auth, acl(["donor", "admin"], "donation", "create"), async (req, res) => {
  try {
    const { amount, purpose, donorPhone } = req.body; // Added donorPhone to destruction
    const donorEmail = req.user.email || req.body.email;

    // Create unique data string for hashing
    const originalData = `${donorEmail}-${amount}-${purpose}`;

    // Generate Digital Signature (Integrity Check)
    const signature = signData(originalData);

    // SECURITY: Encrypt Sensitive Data (Phone Number)
    // If donorPhone is provided, encrypt it.
    const encryptedPhone = donorPhone ? encrypt(donorPhone) : undefined;

    const donation = new Donation({
      donorEmail,
      donorPhone: encryptedPhone, // Save encrypted phone
      amount,
      purpose,
      status: "PENDING",
      dataHash: signature
    });

    await donation.save();

    res.json({
      message: "Donation recorded securely",
      integritySignature: signature
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const ExpenseProof = require("../models/expenseProof");

// Get My Donations - Protected
router.get("/my-donations", auth, async (req, res) => {
  try {
    const User = require("../models/user");
    const user = await User.findById(req.user.id);

    // Fetch donations
    const donations = await Donation.find({ donorEmail: user.email }).lean();

    // Fetch proofs for these donations
    // Using Promise.all to fetch proofs efficiently? Or just one query.
    const donationIds = donations.map(d => d._id);
    const proofs = await ExpenseProof.find({ donationId: { $in: donationIds } }).lean();

    // Attach proofs and decrypt
    const result = donations.map(d => {
      const proof = proofs.find(p => p.donationId.toString() === d._id.toString());
      return {
        ...d,
        expenseProof: proof,
        donorPhone: d.donorPhone ? decrypt(d.donorPhone) : d.donorPhone
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Donations - Admin/Staff Only
// router.get("/all", auth, acl(["admin", "staff"]), ... -> but I don't have staff role in seed?
// Let's allow "admin" to view all.
router.get("/all", auth, acl(["admin", "staff"]), async (req, res) => {
  try {
    const donations = await Donation.find();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Upload Expense Proof - Staff/Admin Only

router.post("/upload-proof", auth, acl(["admin", "staff"]), async (req, res) => {
  try {
    const { donationId, receiptImage, description } = req.body;

    // Determine hash for integrity
    const receiptHash = signData(receiptImage || description);

    const proof = new ExpenseProof({
      donationId,
      receiptImage,
      description,
      receiptHash
    });

    await proof.save();

    // Link proof to donation
    await Donation.findByIdAndUpdate(donationId, {
      status: "UTILIZED",
      // expenseProofId: proof._id 
    });

    res.json({ message: "Proof uploaded securely", proofId: proof._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
