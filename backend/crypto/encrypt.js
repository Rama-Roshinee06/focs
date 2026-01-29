const crypto = require('crypto');
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

exports.encrypt = (text) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

exports.decrypt = (encrypted) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};
