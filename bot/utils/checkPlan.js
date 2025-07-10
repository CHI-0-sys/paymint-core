// bot/utils/checkPlan.js
const Vendor = require("../../models/Vendor");
const moment = require("moment");

async function checkPlan(phone) {
  const vendor = await Vendor.findOne({ phone });

  if (!vendor || !vendor.plan || !vendor.plan.expiresAt) return false;

  const isValid = moment().isBefore(moment(vendor.plan.expiresAt));
  return isValid;
}

module.exports = { checkPlan };
