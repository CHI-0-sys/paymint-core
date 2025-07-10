const Sale = require("../../models/Sale");
const moment = require("moment");

function normalizePhone(jid) {
  return jid.replace(/@s\.whatsapp\.net$/, "");
}

async function handleSalesMonth(sock, from) {
  const phone = normalizePhone(from);

  const start = moment().startOf("month").toDate();
  const end = moment().endOf("month").toDate();

  const sales = await Sale.find({
    vendorPhone: phone,
    createdAt: { $gte: start, $lte: end },
  });

  if (!sales.length) {
    return sock.sendMessage(from, {
      text: `📆 No sales recorded this month.`,
    });
  }

  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  let text = `📊 *This Month's Sales Summary*\n`;
  text += `🧾 Receipts: ${sales.length}\n`;
  text += `💵 Total: ₦${total.toLocaleString("en-NG")}\n\n`;
  text += `🚀 You’re building momentum. Keep pushing!`;

  return sock.sendMessage(from, { text });
}

module.exports = { handleSalesMonth };
