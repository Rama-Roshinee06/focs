const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

exports.signData = (data) => {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'hex');
};

exports.verifySignature = (data, signature) => {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  return verify.verify(publicKey, signature, 'hex');
};

// EXPORT KEYS FOR KEY EXCHANGE MECHANISM
exports.publicKey = publicKey.export({ type: 'pkcs1', format: 'pem' });
exports.privateKey = privateKey;
