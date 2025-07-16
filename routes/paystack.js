// routes/paystack.js
import('dotenv').config();
// import mongoose from 'mongoose';
// import path from 'path';

const express = require('express');

let paystackRouter;
if (!paystackRouter) {
  paystackRouter = express.Router();

  const { validateWebhook, handleWebhook } = require('../services/paystack');

  paystackRouter.use(
    express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  paystackRouter.post('/webhook', async (req, res) => {
    const signature = req.headers['x-paystack-signature'];
    const isValid = validateWebhook(req.headers, req.rawBody);

    if (!isValid) {
      console.log('❌ Invalid Paystack Signature');
      return res.status(400).send('Invalid signature');
    }

    try {
      await handleWebhook(req.body);
      res.sendStatus(200);
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      res.status(500).send('Server error');
    }
  });
}

module.exports = paystackRouter;
