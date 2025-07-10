const mongoose = require("mongoose");

const DailySummarySchema = new mongoose.Schema({
  vendorPhone: {
    type: String,
    required: true,
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
  totalReceipts: {
    type: Number,
    default: 0,
  },
});

DailySummarySchema.index({ vendorPhone: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailySummary", DailySummarySchema);
