const crypto = require('crypto');

// FOR DEMO: Hardcoded for persistence. IN PROD: Use process.env.ENCRYPTION_KEY
const algorithm = 'aes-256-cbc';
const key = Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 bytes
const iv = Buffer.from('1234567890123456', 'utf8'); // 16 bytes

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
    return encrypted; // Return original if decryption fails (e.g. old unencrypted data)
  }
};
