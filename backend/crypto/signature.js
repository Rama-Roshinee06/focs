/**
 * INTEGRITY IMPLEMENTATION (CIA Triad)
 * Algorithm: RSA with SHA-256 (Hashing)
 * Purpose: Ensures data has not been tampered with during transmission or storage.
 */
const crypto = require('crypto');

// Generate a key pair for Digital Signatures (RSA)
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

/**
 * Sign data using SHA-256 and Private Key
 */
exports.signData = (data) => {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'hex');
};

/**
 * Verify data using SHA-256 and Public Key
 */
exports.verifySignature = (data, signature, key = publicKey) => {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  return verify.verify(key, signature, 'hex');
};

// EXPORT KEYS FOR KEY EXCHANGE (Demonstrates Trust)
exports.publicKey = publicKey.export({ type: 'pkcs1', format: 'pem' });
exports.privateKey = privateKey;

