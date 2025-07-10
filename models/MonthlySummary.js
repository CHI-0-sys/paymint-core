const mongoose = require("mongoose");

const MonthlySummarySchema = new mongoose.Schema({
  vendorPhone: {
    type: String,
    required: true,
  },
  month: {
    type: String, // format: YYYY-MM
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

MonthlySummarySchema.index({ vendorPhone: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("MonthlySummary", MonthlySummarySchema);
