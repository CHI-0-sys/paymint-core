// config/mongo.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'your-mongo-uri-here';

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('📦 MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed due to app termination');
    process.exit(0);
});