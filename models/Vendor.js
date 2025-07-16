const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true, // WhatsApp number
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '', // Email used for Paystack & notifications
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  logoUrl: {
    type: String,
    default: '', // Business logo or avatar URL
  },
  contact: {
    type: String,
    default: '', // Additional phone/contact info
  },
  address: {
    type: String,
    default: '',
  },

  // Social Media Handles
  instagram: { type: String, default: '', trim: true, lowercase: true },
  tiktok: { type: String, default: '', trim: true, lowercase: true },
  twitter: { type: String, default: '', trim: true, lowercase: true },
  facebook: { type: String, default: '', trim: true },
  youtube: { type: String, default: '', trim: true },
  website: { type: String, default: '', trim: true },

  // Features & Toggles
  enableSocialMarketing: { type: Boolean, default: true },
  enableShareIncentive: { type: Boolean, default: true },
  shareIncentiveText: {
    type: String,
    default: '🎁 Share this receipt & get 5% off your next purchase!',
  },

  // Subscription & Payments
  plan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  reference: {
    type: String,
    default: '', // Paystack transaction reference (latest)
  },
  subscriptionDate: {
    type: Date,
    default: null, // Date of upgrade
  },
  expiresOn: {
    type: Date,
    default: null,
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔄 Middleware: Track updated time
VendorSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ Virtual: List active socials
VendorSchema.virtual('activeSocials').get(function () {
  const socials = [];
  if (this.instagram) socials.push({ platform: 'instagram', handle: this.instagram });
  if (this.tiktok) socials.push({ platform: 'tiktok', handle: this.tiktok });
  if (this.twitter) socials.push({ platform: 'twitter', handle: this.twitter });
  if (this.facebook) socials.push({ platform: 'facebook', handle: this.facebook });
  if (this.youtube) socials.push({ platform: 'youtube', handle: this.youtube });
  return socials;
});

// ✅ Check if vendor has any social media
VendorSchema.methods.hasSocialMedia = function () {
  return !!(this.instagram || this.tiktok || this.twitter || this.facebook || this.youtube);
};

// ✅ Get formatted social URLs
VendorSchema.methods.getSocialUrls = function () {
  const urls = {};
  if (this.instagram) urls.instagram = `https://instagram.com/${this.instagram}`;
  if (this.tiktok) urls.tiktok = `https://tiktok.com/@${this.tiktok}`;
  if (this.twitter) urls.twitter = `https://twitter.com/${this.twitter}`;
  if (this.facebook) urls.facebook = `https://facebook.com/${this.facebook}`;
  if (this.youtube) urls.youtube = `https://youtube.com/@${this.youtube}`;
  if (this.website) urls.website = this.website;
  return urls;
};

module.exports = mongoose.model("Vendor", VendorSchema);
