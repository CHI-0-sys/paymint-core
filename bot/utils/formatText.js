function formatNumber(n) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

function formatReceiptText({ businessName, customerName, items = [], total = 0, note = "", date, time }) {
  let text = `🧾 *${businessName || "Your Business"}*\n`;

  if (customerName) {
    text += `👤 Customer: ${customerName}\n`;
  }

  if (date && time) {
    text += `🗓️ ${date} ${time}\n`;
  }

  text += `\n`;

  if (items.length) {
    items.forEach((item) => {
      text += `🛍️ ${item.name} - ${formatNumber(item.price)}\n`;
    });
  } else {
    text += `🛍️ No items listed.\n`;
  }

  text += `\n💵 *Total:* ${formatNumber(total)}\n`;

  if (note) {
    text += `📝 Note: ${note}\n`;
  }

  text += `\n🙏🏽 Thanks for shopping with us!\n💚`;

  return text;
}

module.exports = { formatReceiptText };
