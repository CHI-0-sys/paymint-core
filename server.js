// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { validateWebhook } = require('./services/paystack');
const Vendor = require('./models/Vendor');
const app = express();
const PORT = process.env.PORT || 8080;

// Raw body for signature validation
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Webhook route
app.post('/webhook/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const isValid = validateWebhook(req.headers, req.body);

  if (!isValid) {
    console.log("❌ Invalid webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const metadata = event.data.metadata || {};
    const phone = metadata.vendor || "";

    if (!phone) {
      console.log("⚠️ Vendor phone not found in metadata");
      return res.sendStatus(200);
    }

    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    await Vendor.findOneAndUpdate(
      { phone },
      { plan: "premium", expiresOn: expires },
      { upsert: false }
    );

    console.log(`✅ Upgraded ${phone} to premium until ${expires.toDateString()}`);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook listening on port ${PORT}`);
});
