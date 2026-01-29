const express = require('express');
const { signData, verifySignature } = require('../crypto/signature');
const router = express.Router();

router.post('/upload', (req, res) => {
  const receipt = JSON.stringify(req.body);
  const signature = signData(receipt);
  res.json({ signature });
});

router.post('/verify', (req, res) => {
  const valid = verifySignature(req.body.data, req.body.signature);
  res.json({ verified: valid });
});

module.exports = router;
