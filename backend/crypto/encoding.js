/**
 * ENCODING VS ENCRYPTION
 * Note: Encoding is NOT encryption. Encoding transforms data into a format 
 * suitable for transmission, while encryption makes data unreadable without a key.
 */

// Base64 Encoding: Used for binary-to-text representation
exports.encodeBase64 = (text) => {
    return Buffer.from(text).toString('base64');
};

exports.decodeBase64 = (encoded) => {
    return Buffer.from(encoded, 'base64').toString('utf-8');
};

// URL Encoding: Used for safe transmission in web addresses
exports.encodeURL = (text) => {
    return encodeURIComponent(text);
};

exports.decodeURL = (encoded) => {
    return decodeURIComponent(encoded);
};

