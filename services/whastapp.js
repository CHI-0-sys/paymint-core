// ================================
// services/whatsapp.js - Enhanced Payment Notifications
// ================================

// Payment method configurations
const PAYMENT_METHODS = {
    card: {
      emoji: '💳',
      name: 'Debit/Credit Card',
      processingTime: 'Instant',
      features: ['Instant activation', 'Secure payment', 'All cards accepted']
    },
    bank_transfer: {
      emoji: '🏦',
      name: 'Bank Transfer',
      processingTime: '1-3 minutes',
      features: ['Direct bank transfer', 'Secure processing', 'No card required']
    },
    ussd: {
      emoji: '📱',
      name: 'USSD Code',
      processingTime: 'Instant',
      features: ['No internet required', 'Works on any phone', 'Secure payment']
    },
    qr: {
      emoji: '📲',
      name: 'QR Code',
      processingTime: 'Instant',
      features: ['Scan to pay', 'Mobile banking', 'Quick payment']
    },
    mobile_money: {
      emoji: '📲',
      name: 'Mobile Money',
      processingTime: 'Instant',
      features: ['Mobile wallet', 'Instant payment', 'Secure transfer']
    },
    dedicated_account: {
      emoji: '🏧',
      name: 'Dedicated Account',
      processingTime: '1-5 minutes',
      features: ['Unique account number', 'Automatic confirmation', 'Bank transfer']
    }
  };
  
  // ✅ Enhanced payment confirmation with payment method details
  async function sendPaymentConfirmation(sock, vendorPhone, paymentData) {
    try {
      const jid = vendorPhone.includes("@s.whatsapp.net") ? vendorPhone : `${vendorPhone}@s.whatsapp.net`;
      
      const paymentMethod = PAYMENT_METHODS[paymentData.channel] || PAYMENT_METHODS.card;
      const amount = (paymentData.amount / 100).toLocaleString();
      const currentDate = new Date().toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const currentTime = new Date().toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
      });
  
      const message = `🎉 *Payment Successful!*\n\n${paymentMethod.emoji} *Payment Method:* ${paymentMethod.name}\n✅ *Welcome to Paymint Premium!*\n\n💰 *Amount:* ₦${amount}\n📅 *Date:* ${currentDate}\n🕒 *Time:* ${currentTime}\n🔗 *Reference:* ${paymentData.reference}\n⚡ *Processing Time:* ${paymentMethod.processingTime}\n\n🚀 *Premium Features Activated:*\n• Unlimited receipts\n• Priority support\n• Advanced analytics\n• Custom branding\n• Export to Excel/PDF\n• WhatsApp integration\n\n${getPaymentMethodTip(paymentData.channel)}\n\n*Thank you for upgrading to Paymint Premium!* 🙏\n\nType /help to explore all premium features.`;
  
      await sock.sendMessage(jid, { text: message });
      console.log(`✅ Payment confirmation sent to ${vendorPhone} via ${paymentMethod.name}`);
    } catch (error) {
      console.error('❌ Error sending payment confirmation:', error);
    }
  }
  
  // ✅ Enhanced payment failure notification with payment method context
  async function sendPaymentFailure(sock, vendorPhone, failureData = {}) {
    try {
      const jid = vendorPhone.includes("@s.whatsapp.net") ? vendorPhone : `${vendorPhone}@s.whatsapp.net`;
      
      const { channel, reference, reason, gateway_response } = failureData;
      const paymentMethod = PAYMENT_METHODS[channel] || { emoji: '💳', name: 'Payment' };
      
      let message = `❌ *Payment Failed*\n\n${paymentMethod.emoji} *Payment Method:* ${paymentMethod.name}\n⚠️ Your payment could not be processed.\n\n`;
      
      if (reference) {
        message += `🔗 *Reference:* ${reference}\n`;
      }
      
      if (reason || gateway_response) {
        message += `📝 *Reason:* ${reason || gateway_response}\n`;
      }
      
      message += `\n*What to do next:*\n`;
      message += getFailureRecommendations(channel);
      
      message += `\n*Quick Actions:*\n• Type */card* - Try card payment\n• Type */transfer* - Use bank transfer\n• Type */pay* - See all payment options\n\n*Need help?* Contact our support team.\n\nDon't worry, you can try again! 💪`;
  
      await sock.sendMessage(jid, { text: message });
      console.log(`📱 Payment failure notification sent to ${vendorPhone} for ${paymentMethod.name}`);
    } catch (error) {
      console.error('❌ Error sending payment failure notification:', error);
    }
  }
  
  // ✅ Send dedicated account details notification
  async function sendDedicatedAccountDetails(sock, vendorPhone, accountData) {
    try {
      const jid = vendorPhone.includes("@s.whatsapp.net") ? vendorPhone : `${vendorPhone}@s.whatsapp.net`;
      
      const expiryTime = new Date(accountData.expires_at).toLocaleString('en-NG');
      
      const message = `🏦 *Dedicated Account Created*\n\n💳 *Account Details:*\n🏦 Bank: ${accountData.bank_name}\n💳 Account: ${accountData.account_number}\n👤 Name: ${accountData.account_name}\n💰 Amount: ₦${accountData.amount.toLocaleString()}\n\n⏰ *Expires:* ${expiryTime}\n\n⚠️ *Important Instructions:*\n• Transfer exactly ₦${accountData.amount.toLocaleString()}\n• Use the account number above\n• Payment confirms automatically\n• Keep your transfer receipt\n• Account expires in 24 hours\n\n📱 *How to Transfer:*\n1. Open your banking app\n2. Transfer to the account above\n3. Wait for confirmation (1-3 minutes)\n4. Your premium features will activate\n\n🔗 *Reference:* ${accountData.reference}\n\n*Questions?* Contact support anytime! 💬`;
  
      await sock.sendMessage(jid, { text: message });
      console.log(`🏦 Dedicated account details sent to ${vendorPhone}`);
    } catch (error) {
      console.error('❌ Error sending dedicated account details:', error);
    }
  }
  
  // ✅ Send payment pending notification for bank transfers
  async function sendPaymentPending(sock, vendorPhone, paymentData) {
    try {
      const jid = vendorPhone.includes("@s.whatsapp.net") ? vendorPhone : `${vendorPhone}@s.whatsapp.net`;
      
      const paymentMethod = PAYMENT_METHODS[paymentData.channel] || PAYMENT_METHODS.bank_transfer;
      
      const message = `⏳ *Payment Pending*\n\n${paymentMethod.emoji} *Payment Method:* ${paymentMethod.name}\n📄 We've received your payment request.\n\n🔗 *Reference:* ${paymentData.reference}\n⏱️ *Processing Time:* ${paymentMethod.processingTime}\n\n*What happens next:*\n• Your payment is being processed\n• You'll receive confirmation shortly\n• Premium features will activate automatically\n\n*Status Updates:*\n• Type */status* to check progress\n• We'll notify you when complete\n\nThank you for your patience! ⏰`;
  
      await sock.sendMessage(jid, { text: message });
      console.log(`⏳ Payment pending notification sent to ${vendorPhone}`);
    } catch (error) {
      console.error('❌ Error sending payment pending notification:', error);
    }
  }
  
  // ✅ Send payment method recommendations
  async function sendPaymentMethodRecommendations(sock, vendorPhone) {
    try {
      const jid = vendorPhone.includes("@s.whatsapp.net") ? vendorPhone : `${vendorPhone}@s.whatsapp.net`;
      
      const message = `💡 *Payment Method Guide*\n\n*Choose what works best for you:*\n\n💳 *Card Payment* - Instant\n✅ Best for: Quick payment\n✅ All debit/credit cards accepted\n✅ Instant activation\n🔗 Type: */card*\n\n🏦 *Bank Transfer* - 1-3 minutes\n✅ Best for: Direct bank payment\n✅ No card required\n✅ Secure processing\n🔗 Type: */transfer*\n\n📱 *USSD Code* - Instant\n✅ Best for: No internet needed\n✅ Works on any phone\n✅ Dial code to pay\n🔗 Type: */pay*\n\n📲 *Mobile Money* - Instant\n✅ Best for: Mobile wallet users\n✅ Quick mobile payment\n✅ Secure transfer\n🔗 Type: */pay*\n\n*Need help choosing?* Contact support! 💬`;
  
      await sock.sendMessage(jid, { text: message });
      console.log(`💡 Payment method recommendations sent to ${vendorPhone}`);
    } catch (error) {
      console.error('❌ Error sending payment recommendations:', error);
    }
  }
  
  // ✅ Get payment method specific tips
  function getPaymentMethodTip(channel) {
    const tips = {
      card: `💡 *Tip:* Save this payment method for future renewals!`,
      bank_transfer: `💡 *Tip:* Bank transfers are perfect for larger amounts and offer great security.`,
      ussd: `💡 *Tip:* USSD payments work even without internet - perfect for any situation!`,
      qr: `💡 *Tip:* QR payments are the fastest way to pay with your mobile banking app.`,
      mobile_money: `💡 *Tip:* Mobile money is great for quick, secure payments from your phone.`,
      dedicated_account: `💡 *Tip:* Dedicated accounts provide unique payment tracking for your business.`
    };
    
    return tips[channel] || `💡 *Tip:* You can renew your subscription anytime with the same payment method!`;
  }
  
  // ✅ Get failure recommendations based on payment method
  function getFailureRecommendations(channel) {
    const recommendations = {
      card: `• Check your card details are correct\n• Ensure sufficient balance\n• Try a different card\n• Check if card is enabled for online payments\n• Contact your bank if issues persist`,
      bank_transfer: `• Verify account details\n• Check bank network status\n• Ensure sufficient balance\n• Try again in a few minutes\n• Use a different bank if available`,
      ussd: `• Check your phone network\n• Ensure sufficient balance\n• Try dialing the USSD code again\n• Check if USSD is enabled\n• Contact your network provider`,
      qr: `• Ensure QR code is clear\n• Check your banking app\n• Verify internet connection\n• Try scanning again\n• Use alternative payment method`,
      mobile_money: `• Check mobile wallet balance\n• Verify phone number\n• Ensure service is active\n• Try again in a few minutes\n• Contact mobile money provider`,
      dedicated_account: `• Verify transfer amount\n• Check account number\n• Ensure account hasn't expired\n• Try a different bank\n• Contact support for new account`
    };
    
    return recommendations[channel] || `• Check your payment details\n• Ensure sufficient funds\n• Try a different payment method\n• Contact support if needed`;
  }
  
  // ✅ Send subscription renewal reminder
  async function sendRenewalReminder(sock, vendorPhone, daysLeft) {
    try {
      const jid = vendorPhone.includes("@s.whatsapp.net") ? vendorPhone : `${vendorPhone}@s.whatsapp.net`;
      
      const urgency = daysLeft <= 3 ? '🚨' : daysLeft <= 7 ? '⚠️' : '📅';
      const message = `${urgency} *Subscription Reminder*\n\n💎 Your Paymint Premium subscription expires in *${daysLeft} day${daysLeft > 1 ? 's' : ''}*.\n\n*Don't lose access to:*\n• Unlimited receipts\n• Priority support\n• Advanced analytics\n• Custom branding\n\n*Renew now to continue:*\n• Type */subscribe* - See all options\n• Type */card* - Quick card payment\n• Type */transfer* - Bank transfer\n\n*Questions?* Contact support! 💬`;
  
      await sock.sendMessage(jid, { text: message });
      console.log(`📅 Renewal reminder sent to ${vendorPhone} - ${daysLeft} days left`);
    } catch (error) {
      console.error('❌ Error sending renewal reminder:', error);
    }
  }
  
  module.exports = {
    sendPaymentConfirmation,
    sendPaymentFailure,
    sendDedicatedAccountDetails,
    sendPaymentPending,
    sendPaymentMethodRecommendations,
    sendRenewalReminder,
    PAYMENT_METHODS
  };