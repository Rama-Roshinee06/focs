const mongoose = require('mongoose');

module.exports = () => {
  mongoose.connect('mongodb://127.0.0.1:27017/orphanage_security', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log("MongoDB connected"));
};
