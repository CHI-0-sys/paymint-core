// bot/utils/parseReceipt.js

function parseReceiptItems(body) {
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  
    const items = [];
    let customerName = "";
    let note = "";
  
    lines.forEach((line) => {
      const lower = line.toLowerCase();
  
      if (lower.startsWith("customer:")) {
        customerName = line.split(":")[1]?.trim() || "";
      } else if (lower.startsWith("note:")) {
        note = line.split(":")[1]?.trim() || "";
      } else if (line.includes("-")) {
        const [name, priceStr] = line.split("-").map((s) => s.trim());
        const price = parseFloat(priceStr.replace(/[₦,]/g, ""));
  
        if (name && !isNaN(price)) {
          items.push({ name, price });
        }
      }
    });
  
    const total = items.reduce((sum, item) => sum + item.price, 0);
  
    return { items, total, customerName, note };
  }
  
  module.exports = { parseReceiptItems };
  