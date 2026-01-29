const router = require("express").Router();
const Donation = require("../models/Donation");

router.post("/create", async (req, res) => {
  try {
    const donation = new Donation({
      donorEmail: req.body.email,
      amount: req.body.amount,
      purpose: req.body.purpose,
      status: "PENDING"
    });

    await donation.save();
    res.json({ message: "Donation recorded securely" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
