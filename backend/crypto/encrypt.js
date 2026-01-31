/**
 * CONFIDENTIALITY IMPLEMENTATION (CIA Triad)
 * Algorithm: AES-256-CBC (Advanced Encryption Standard)
 * Purpose: Ensures sensitive data (like donor phone numbers) is unreadable without the secret key.
 */
const crypto = require('crypto');

// FOR DEMO: Hardcoded for persistence. IN PROD: Use process.env.ENCRYPTION_KEY
// AES-256 requires a 32-byte key.
const algorithm = 'aes-256-cbc';
const key = Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 bytes (256 bits)
const iv = Buffer.from('1234567890123456', 'utf8'); // 16 bytes (Initialisation Vector)

exports.encrypt = (text) => {
  if (!text) return text;
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

exports.decrypt = (encrypted) => {
  if (!encrypted) return encrypted;
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    // If decryption fails (e.g. data wasn't encrypted), return original text
    return encrypted;
  }
};

