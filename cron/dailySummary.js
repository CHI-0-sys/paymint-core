// cron/dailySummary.js
const { getDB } = require("../services/db");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const moment = require("moment");

async function runDailySummary() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  const db = getDB();
  const vendors = await db.collection("vendors").find().toArray();

  const today = moment().startOf("day").toDate();
  const tomorrow = moment().endOf("day").toDate();

  for (const vendor of vendors) {
    const sales = await db.collection("sales").find({
      vendorPhone: vendor.phone,
      createdAt: { $gte: today, $lte: tomorrow },
    }).toArray();

    if (sales.length === 0) continue;

    const total = sales.reduce((sum, s) => sum + s.total, 0);

    const message = `📊 *Daily Sales Summary*\n\nBusiness: ${vendor.businessName}\nTotal Sales Today: ₦${total.toLocaleString("en-NG")}\nTransactions: ${sales.length}\n\nKeep selling! 💰`;

    await sock.sendMessage(vendor.phone, { text: message });
  }

  console.log("✅ Daily summary sent to all vendors.");
}

module.exports = { runDailySummary };
