const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

async function generateReceiptImage({ businessName, customerName, items, total, note, logoPath }) {
  const width = 600;
  const lineHeight = 28;
  const padding = 30;
  const textLines = [
    `🧾 ${businessName}`,
    customerName ? `Customer: ${customerName}` : "",
    "",
    ...items.map((item) => `${item.name} - ₦${item.price.toLocaleString("en-NG")}`),
    "",
    `💵 Total: ₦${total.toLocaleString("en-NG")}`,
    note ? `📝 Note: ${note}` : "",
    "",
    `Thanks for shopping 💚`,
  ].filter(Boolean);

  let y = padding;
  let logoHeight = 0;

  if (logoPath && fs.existsSync(logoPath)) {
    const logo = await loadImage(logoPath);
    logoHeight = 80;
    y += logoHeight + 10;
  }

  const height = y + textLines.length * lineHeight + padding;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw logo
  if (logoPath && fs.existsSync(logoPath)) {
    const logo = await loadImage(logoPath);
    ctx.drawImage(logo, width / 2 - 40, padding, 80, logoHeight); // center the logo
  }

  // Text
  ctx.fillStyle = 'black';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';

  textLines.forEach((line) => {
    ctx.fillText(line, padding, y);
    y += lineHeight;
  });

  return canvas.toBuffer('image/png');
}
