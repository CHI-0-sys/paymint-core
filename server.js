require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');


// Import routes
const { handlePaystackWebhook } = require('./controllers/webhook');
const subscriptionRoutes = require('./routes/subscription');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Paystack webhook (needs raw body)
app.post('/api/paystack/webhook', express.raw({ type: '*/*' }), handlePaystackWebhook);

// ✅ Normal middleware (for other routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use('/subscribe', subscriptionRoutes);

// ✅ Root test route
app.get('/', (req, res) => {
  res.send('🚀 Paymint API is running...');
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

//middleware to capture raw body for paystack
app.use('/weebhook/paystack',bodyParser.raw({type :'*/*'})); 

//route for paystack webhook
app.posta('/webhook/paystack', handlePaystackWebhook);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🔗 Webhook URL: ${process.env.BASE_URL || 'http://localhost:' + PORT}/api/paystack/webhook`);
});