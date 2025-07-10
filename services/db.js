// services/db.js
const mongoose = require("mongoose");
require("dotenv").config();

let isConnected = false;
let dbRef = null;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is missing in .env file");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    dbRef = mongoose.connection;
    isConnected = true;

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

function getDB() {
  if (!dbRef) {
    throw new Error("❌ DB not connected yet. Call connectDB() first.");
  }
  return dbRef;
}

module.exports = {
  connectDB,
  getDB,
};
