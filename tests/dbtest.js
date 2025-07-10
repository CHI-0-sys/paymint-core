require('dotenv').config(); // loads the .env file
require('../config/mongo'); // connects to MongoDB

const Vendor = require('../models/Vendor');

async function testInsertVendor() {
  try {
    const result = await Vendor.create({
      phone: '2348012345678',
      businessName: 'Test Business',
      logoUrl: '',
      plan: 'free',
    });

    console.log('✅ Vendor inserted successfully:', result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error inserting vendor:', err);
    process.exit(1);
  }
}

testInsertVendor();
