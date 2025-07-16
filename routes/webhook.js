// routes/webhook.js
const express = require('express');
const router = express.Router();
const { handlePaystackWebhook } = require('../controllers/webhook');

// Parse raw body (needed to verify Paystack signature)
router.post('/', express.raw({ type: 'application/json' }), handlePaystackWebhook);

module.exports = router;
