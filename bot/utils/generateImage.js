const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

// Try to register font, but don't fail if it doesn't work
try {
  const { registerFont } = require('@napi-rs/canvas');
  const fontPath = path.join(__dirname, 'fonts/OpenSans-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, {
      family: 'Open Sans',
    });
  }
} catch (error) {
  console.log('Custom font not available, using system fonts');
}

async function generateReceiptImage({ vendor, items, total, note, date, time }) {
  const width = 400;
  const padding = 20;
  const lineHeight = 22;
  const logoSize = 60;
  const spacing = 12;

  const headerHeight = logoSize + spacing + 80;
  const itemsHeight = items.length * lineHeight + 40;
  const vatHeight = 30;
  const footerHeight = 160;
  const height = padding * 2 + headerHeight + itemsHeight + vatHeight + footerHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  let currentY = padding;

  // Verification badge at top
  drawVerificationBadge(ctx, width - 80, currentY, 60, 20);

  // Logo
  if (vendor.logoPath && fs.existsSync(vendor.logoPath)) {
    try {
      const logo = await loadImage(vendor.logoPath);
      const logoX = (width - logoSize) / 2;
      ctx.drawImage(logo, logoX, currentY, logoSize, logoSize);
    } catch (e) {
      console.error('⚠️ Failed to load logo image:', e.message);
    }
  }
  currentY += logoSize + spacing;
  
  // Business name - larger and bolder
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(vendor.businessName || 'Your Business', width / 2, currentY);
  currentY += 28;

  // Contact and address - smaller, cleaner
  ctx.font = '12px Arial, sans-serif';
  if (vendor.contact) {
    ctx.fillText(vendor.contact, width / 2, currentY);
    currentY += 16;
  }
  if (vendor.address) {
    ctx.fillText(vendor.address, width / 2, currentY);
    currentY += 20;
  }

  // Receipt verification info
  ctx.font = '10px Arial, sans-serif';
  ctx.fillStyle = '#1a73e8';
  ctx.fillText('✓ Verified Receipt | Powered by Paymint', width / 2, currentY);
  ctx.fillStyle = '#000000';
  currentY += 25;

  // Date and time - better formatting
  ctx.textAlign = 'left';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText(`Date: ${date}`, padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`Time: ${time}`, width - padding, currentY);
  currentY += 25;

  // Solid line separator
  drawSolidLine(ctx, padding, currentY, width - padding, currentY);
  currentY += 18;

  // Items section header
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ITEM', padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', width - padding, currentY);
  currentY += 18;

  // Items
  ctx.font = '12px Arial, sans-serif';
  items.forEach(item => {
    ctx.textAlign = 'left';
    ctx.fillText(item.name, padding, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(formatPrice(item.price), width - padding, currentY);
    currentY += lineHeight;
  });

  currentY += 8;

  // Separator line
  drawSolidLine(ctx, padding, currentY, width - padding, currentY);
  currentY += 18;

  // Subtotal
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SUBTOTAL', padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(formatPrice(total), width - padding, currentY);
  currentY += 22;

  // VAT (0%)
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VAT (0%)', padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText('₦0.00', width - padding, currentY);
  currentY += 18;

  // Another separator line
  drawSolidLine(ctx, padding, currentY, width - padding, currentY);
  currentY += 18;

  // Total - larger and bolder
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL', padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(formatPrice(total), width - padding, currentY);
  currentY += 28;

  // Note
  if (note) {
    ctx.font = 'italic 11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Note:', padding, currentY);
    currentY += 16;

    const noteLines = wrapText(ctx, note, width - padding * 2);
    noteLines.forEach(line => {
      ctx.fillText(line, padding, currentY);
      currentY += 16;
    });
    currentY += 8;
  }

  // Separator line
  drawSolidLine(ctx, padding, currentY, width - padding, currentY);
  currentY += 18;

  // Thank you message
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.fillText('Thanks for shopping with us 💚', width / 2, currentY);
  currentY += 30;

  // Enhanced barcode
  drawEnhancedBarcode(ctx, padding, currentY, width - padding * 2, 50);
  currentY += 55;

  // Generated by Paymint with verification
  ctx.font = 'italic 9px Arial, sans-serif';
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.fillText('✓ Verified & Generated by Paymint', width / 2, currentY);

  return canvas.toBuffer('image/png');
}

function drawVerificationBadge(ctx, x, y, width, height) {
  // Green verification badge
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(x, y, width, height);
  
  // White text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓ VERIFIED', x + width/2, y + height/2 + 3);
}

function drawSolidLine(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawEnhancedBarcode(ctx, x, y, width, height) {
  ctx.fillStyle = '#000000';
  
  // Create a more realistic barcode pattern
  const bars = 60;
  const barWidth = width / bars;
  
  // Generate barcode pattern with better distribution
  const pattern = [];
  for (let i = 0; i < bars; i++) {
    if (i % 4 === 0 || i % 7 === 0) {
      pattern.push(1); // thick bar
    } else if (i % 2 === 0) {
      pattern.push(0.6); // medium bar
    } else {
      pattern.push(Math.random() > 0.4 ? 0.8 : 0); // random pattern
    }
  }

  // Draw the barcode
  for (let i = 0; i < bars; i++) {
    if (pattern[i] > 0) {
      const barX = x + i * barWidth;
      const barHeight = height * pattern[i];
      const barY = y + (height - barHeight);
      
      ctx.fillRect(barX, barY, barWidth * 0.8, barHeight);
    }
  }
  
  // Add start and end bars (typical for barcodes)
  ctx.fillRect(x, y, 2, height);
  ctx.fillRect(x + width - 2, y, 2, height);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function formatPrice(value) {
  const num = parseFloat(value);
  if (!isNaN(num)) {
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return value;
}

module.exports = { generateReceiptImage };