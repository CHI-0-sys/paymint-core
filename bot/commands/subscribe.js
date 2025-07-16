const Vendor = require("../../models/Vendor");
const { generateSubscriptionLink, createBankTransferPayment } = require("../../services/paystack");

// ✅ Normalize WhatsApp ID
function normalizeJid(jid) {
  if (!jid || typeof jid !== 'string') {
    throw new Error(`Invalid JID: Expected string, got ${typeof jid} - ${jid}`);
  }
  return jid.includes("@s.whatsapp.net") ? jid : `${jid}@s.whatsapp.net`;
}

// ✅ Main subscribe command
async function handleSubscribe(sock, msg, from) {
  console.log('🔍 handleSubscribe called with:', { from });

  if (!from || !sock) {
    console.error('❌ handleSubscribe: Missing required parameters');
    return;
  }

  let jid;
  try {
    jid = normalizeJid(from);
  } catch (error) {
    console.error('❌ Error normalizing JID:', error.message);
    return;
  }

  try {
    const vendor = await Vendor.findOne({ phone: from });
    
    if (!vendor) {
      return sock.sendMessage(jid, {
        text: `⚠️ You need to set up your business first.\n\nType /start to begin onboarding.`,
      });
    }

    if (vendor.plan === "premium") {
      return sock.sendMessage(jid, {
        text: `💎 You're already on the Premium plan.\nNo need to subscribe again.`,
      });
    }

    if (!vendor.email) {
      return sock.sendMessage(jid, {
        text: `📧 To continue, please add your business email.\n\nType:\n*/email your@email.com*`,
      });
    }

    // ✅ Show payment options
    const paymentOptions = `💳 *Choose Your Payment Method*\n\n🔓 Upgrade to Paymint Premium for ₦1,000\n\n*Payment Options:*\n1️⃣ Card Payment (Instant)\n2️⃣ Bank Transfer (Manual)\n3️⃣ All Payment Methods\n\n*Reply with:*\n• */card* - Pay with debit/credit card\n• */transfer* - Pay via bank transfer\n• */pay* - See all payment options`;

    await sock.sendMessage(jid, { text: paymentOptions });

  } catch (err) {
    console.error("❌ Subscription error:", err.message);
    
    try {
      const errorJid = normalizeJid(from);
      await sock.sendMessage(errorJid, {
        text: `❌ Something went wrong. Please try again later or contact support.`,
      });
    } catch (jidError) {
      console.error("❌ Could not send error message:", jidError.message);
    }
  }
}

// ✅ Handle card payment
async function handleCardPayment(sock, msg, from) {
  let jid;
  try {
    jid = normalizeJid(from);
    const vendor = await Vendor.findOne({ phone: from });
    
    if (!vendor || !vendor.email) {
      return sock.sendMessage(jid, {
        text: `❌ Please complete your profile first. Type /subscribe to start.`,
      });
    }

    // Generate payment link with all methods but highlight card
    const paymentLink = await generateSubscriptionLink({
      email: vendor.email,
      phone: vendor.phone
    });

    if (!paymentLink) {
      return sock.sendMessage(jid, {
        text: `❌ Couldn't create payment link. Please try again.`,
      });
    }

    await sock.sendMessage(jid, {
      text: `💳 *Card Payment*\n\n🔓 Upgrade to Paymint Premium\n💰 Amount: ₦1,000\n\n✅ Instant activation\n✅ Secure payment\n✅ All cards accepted\n\nClick to pay:\n${paymentLink}`,
    });

  } catch (error) {
    console.error('❌ Card payment error:', error);
    await sock.sendMessage(jid, {
      text: `❌ Error processing card payment. Please try again.`,
    });
  }
}

// ✅ Handle bank transfer payment
async function handleBankTransfer(sock, msg, from) {
  let jid;
  try {
    jid = normalizeJid(from);
    const vendor = await Vendor.findOne({ phone: from });
    
    if (!vendor || !vendor.email) {
      return sock.sendMessage(jid, {
        text: `❌ Please complete your profile first. Type /subscribe to start.`,
      });
    }

    // Create dedicated bank transfer
    const transferDetails = await createBankTransferPayment({
      email: vendor.email,
      phone: vendor.phone
    });

    if (!transferDetails) {
      return sock.sendMessage(jid, {
        text: `❌ Couldn't create bank transfer. Please try again or use /card for instant payment.`,
      });
    }

    const transferMessage = `🏦 *Bank Transfer Payment*\n\n💰 Amount: ₦${transferDetails.amount.toLocaleString()}\n\n*Transfer to:*\n🏦 Bank: ${transferDetails.bank_name}\n💳 Account: ${transferDetails.account_number}\n👤 Name: ${transferDetails.account_name}\n\n⚠️ *Important:*\n• Transfer exactly ₦${transferDetails.amount.toLocaleString()}\n• Account expires in 24 hours\n• Payment confirms automatically\n• Keep your receipt\n\n📝 Reference: ${transferDetails.reference}`;

    await sock.sendMessage(jid, { text: transferMessage });

  } catch (error) {
    console.error('❌ Bank transfer error:', error);
    await sock.sendMessage(jid, {
      text: `❌ Error creating bank transfer. Please try again.`,
    });
  }
}

// ✅ Handle all payment methods
async function handleAllPaymentMethods(sock, msg, from) {
  let jid;
  try {
    jid = normalizeJid(from);
    const vendor = await Vendor.findOne({ phone: from });
    
    if (!vendor || !vendor.email) {
      return sock.sendMessage(jid, {
        text: `❌ Please complete your profile first. Type /subscribe to start.`,
      });
    }

    const paymentLink = await generateSubscriptionLink({
      email: vendor.email,
      phone: vendor.phone
    });

    if (!paymentLink) {
      return sock.sendMessage(jid, {
        text: `❌ Couldn't create payment link. Please try again.`,
      });
    }

    await sock.sendMessage(jid, {
      text: `💳 *All Payment Methods*\n\n🔓 Upgrade to Paymint Premium\n💰 Amount: ₦1,000\n\n*Available Methods:*\n💳 Debit/Credit Cards\n🏦 Bank Transfer\n📱 USSD Codes\n📲 Mobile Money\n🔗 QR Codes\n\nClick to choose:\n${paymentLink}`,
    });

  } catch (error) {
    console.error('❌ All payment methods error:', error);
    await sock.sendMessage(jid, {
      text: `❌ Error loading payment methods. Please try again.`,
    });
  }
}

module.exports = { 
  handleSubscribe, 
  handleCardPayment, 
  handleBankTransfer, 
  handleAllPaymentMethods 
};