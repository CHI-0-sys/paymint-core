const Sale = require("../../models/Sale");
const DailySummary = require("../../models/DailySummary");
const MonthlySummary = require("../../models/MonthlySummary");
const { parseReceiptItems } = require("../utils/parseReceipt");
const { formatReceiptText } = require("../utils/formatText");
const { generateReceiptImage } = require("../utils/generateImage");

function normalizePhone(jid) {
  return jid.replace(/@s\.whatsapp\.net$/, "");
}

function getSocialLink(vendor) {
  if (vendor.instagram) return `https://instagram.com/${vendor.instagram}`;
  if (vendor.tiktok) return `https://tiktok.com/@${vendor.tiktok}`;
  if (vendor.twitter) return `https://twitter.com/${vendor.twitter}`;
  if (vendor.facebook) return `https://facebook.com/${vendor.facebook}`;
  if (vendor.youtube) return `https://youtube.com/@${vendor.youtube}`;
  if (vendor.website) return vendor.website;
  return null;
}

async function handleReceipt(sock, msg, from, text, vendor) {
  const body = text.replace("/receipt", "").trim();

  if (!body) {
    return sock.sendMessage(from, {
      text: `📦 Send items like this:\n\n/receipt\nPants - 2500\nShoes - 4500\nCap - 1500\n\nAdd an optional customer name or note at the end.`,
    });
  }

  const { items, total, customerName, note } = parseReceiptItems(body);

  if (!items.length) {
    return sock.sendMessage(from, {
      text: `❌ No valid items found. Use format:\n\nItem - Price\nEg: Shirt - 3000`,
    });
  }

  const vendorPhone = normalizePhone(from);

  // ✅ Check receipt limit for free users
  if (vendor.plan === "free") {
    const count = await Sale.countDocuments({ vendorPhone });
    if (count >= 3) {
      return sock.sendMessage(from, {
        text: `🚫 You've reached your free receipt limit (3 receipts).\n\nTo continue using Paymint, type */subscribe* to upgrade to Premium.`,
      });
    }
  }

  await Sale.create({
    vendorPhone,
    customerName,
    items,
    total,
    note,
    createdAt: new Date(),
  });

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  await DailySummary.findOneAndUpdate(
    { vendorPhone, date: dateStr },
    { $inc: { totalSales: total, totalReceipts: 1 } },
    { upsert: true }
  );

  await MonthlySummary.findOneAndUpdate(
    { vendorPhone, month: monthStr },
    { $inc: { totalSales: total, totalReceipts: 1 } },
    { upsert: true }
  );

  const receiptText = formatReceiptText({
    businessName: vendor.businessName || "Your Business",
    customerName,
    items,
    total,
    note,
  });

  await sock.sendMessage(from, { text: receiptText });

  const imageBuffer = await generateReceiptImage({
    vendor,
    items,
    total,
    note,
    date: dateStr,
    time: now.toTimeString().split(" ")[0],
  });

  // 👇 Add caption with social media or fallback
  const socialLink = getSocialLink(vendor);
  const caption = socialLink
    ? `🧾 Receipt (Image)\n\n📲 Follow us for more: ${socialLink}`
    : "🧾 Receipt (Image)";

  await sock.sendMessage(from, {
    image: imageBuffer,
    caption,
  });
}

module.exports = { handleReceipt };
