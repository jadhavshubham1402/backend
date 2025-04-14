const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://Shubham4153:jwlPeUJlnTu5B2wB@cluster0.zqwaqvf.mongodb.net/backend';

const connectToDatabase = new Promise((resolve, reject) => {
  mongoose
    .connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      resolve(data);
      console.log('connected to mongodb');
    })
    .catch((err) => {
      reject(err); // Pass error to reject
      console.log('MongoDB connection error:', err);
    });
});

module.exports = connectToDatabase;