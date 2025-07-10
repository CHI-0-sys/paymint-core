const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  qty: Number, // <-- Important if using quantity
}, { _id: false }); // Optional: avoid creating _id for each item

const SaleSchema = new mongoose.Schema({
  vendorPhone: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    default: '',
  },
  items: {
    type: [ItemSchema],
    default: [],
  },
  total: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Sale", SaleSchema);
