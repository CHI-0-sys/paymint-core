const Sale = require("../../models/Sale");
const moment = require("moment");

function normalizePhone(jid) {
  return jid.replace(/@s\.whatsapp\.net$/, "");
}

async function handleSalesToday(sock, from) {
  const phone = normalizePhone(from);

  const start = moment().startOf("day").toDate();
  const end = moment().endOf("day").toDate();

  const sales = await Sale.find({
    vendorPhone: phone,
    createdAt: { $gte: start, $lte: end },
  });

  if (!sales.length) {
    return sock.sendMessage(from, {
      text: `📊 No sales recorded today.`,
    });
  }

  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  let text = `📅 *Today's Sales Summary*\n`;
  text += `🧾 Receipts: ${sales.length}\n`;
  text += `💵 Total: ₦${total.toLocaleString("en-NG")}\n\n`;
  text += `✅ Keep going! Consistency is profit.`;

  return sock.sendMessage(from, { text });
}

module.exports = { handleSalesToday };
