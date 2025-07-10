// tests/parsereceipt.test.js
const { parseReceiptText } = require('../utils/parseReceiptText');

describe('parseReceiptText()', () => {
  it('should parse simple receipt text', () => {
    const input = `
      Rice x2 ₦500
      Beans x1 ₦300
      Total: ₦1300
    `;

    const { items, total } = parseReceiptText(input);

    expect(items).toEqual([
      { name: 'Rice', qty: 2, price: 500 },
      { name: 'Beans', qty: 1, price: 300 },
    ]);

    expect(total).toBe(1300);
  });

  it('should handle extra whitespace and different casing', () => {
    const input = `
      Indomie x3 ₦150  
      water x1 ₦100
      total: ₦550
    `;

    const { items, total } = parseReceiptText(input);

    expect(items).toEqual([
      { name: 'Indomie', qty: 3, price: 150 },
      { name: 'water', qty: 1, price: 100 },
    ]);

    expect(total).toBe(550);
  });

  it('should return empty if nothing matches', () => {
    const input = `hello world, nothing here`;

    const { items, total } = parseReceiptText(input);

    expect(items).toEqual([]);
    expect(total).toBe(0);
  });
});
