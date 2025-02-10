require('dotenv').config();

const mongoose = require('mongoose');
const uri = process.env.DB_URI;


async function connectDb() {
  try {
    await mongoose.connect(uri, {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Pinged to deployment. successfully connected to MongoDB!");
  } catch(err) {
    console.log("error in db connection=", err.message);
  }
}



module.exports= connectDb;