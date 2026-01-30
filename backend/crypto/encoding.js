// ENCODING & DECODING IMPLEMENTATION

exports.encodeBase64 = (text) => {
    return Buffer.from(text).toString('base64');
};

exports.decodeBase64 = (encoded) => {
    return Buffer.from(encoded, 'base64').toString('utf-8');
};

// Usage Example/Test
// console.log(exports.encodeBase64("Hello World"));
