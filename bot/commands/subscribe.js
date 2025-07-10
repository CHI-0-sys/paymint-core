const Vendor = require("../../models/Vendor");
const moment = require("moment");

const countryPricing = {
  NG: { currency: "NGN", amount: 1000 },
  GH: { currency: "GHS", amount: 15 },
  KE: { currency: "KES", amount: 180 },
  UG: { currency: "UGX", amount: 3500 },
  ZA: { currency: "ZAR", amount: 18 },
  US: { currency: "USD", amount: 1 },
};

async function handleSubscribe(sock, from) {
  const vendor = await Vendor.findOne({ phone: from });

  if (!vendor) {
    return sock.sendMessage(from, {
      text: `❌ You must onboard first. Type /start to begin.`,
    });
  }

  if (vendor.plan === "premium" && vendor.expiresOn && moment(vendor.expiresOn).isAfter(moment())) {
    return sock.sendMessage(from, {
      text: `🎉 You're already on the *Premium* plan!\nValid until *${moment(vendor.expiresOn).format("MMM Do, YYYY")}*.`,
    });
  }

  // Default to Nigeria if no country
  const countryCode = vendor.country || "NG";
  const pricing = countryPricing[countryCode];

  if (!pricing) {
    return sock.sendMessage(from, {
      text: `❌ Subscription is not yet available for your country.`,
    });
  }

  const paystackAmount = Math.round(pricing.amount * 100); // Paystack uses kobo/pesewa/etc
  const paystackLink = `https://paystack.com/pay/receiptx-premium?vendor=${encodeURIComponent(from)}&currency=${pricing.currency}&amount=${paystackAmount}`;

  return sock.sendMessage(from, {
    text: `🚀 *Upgrade to Premium* for:\n✅ Logo on receipts\n✅ Image receipts\n✅ Sales reports\n\n💰 *Price:* ${pricing.amount} ${pricing.currency}\n\n💳 Pay here:\n${paystackLink}`,
  });
}

module.exports = { handleSubscribe };
