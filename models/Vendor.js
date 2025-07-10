// models/Vendor.js
const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true, // WhatsApp number
  },
  businessName: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String, // Path to uploaded logo image
    default: '',
  },
  // Business contact information
  contact: {
    type: String,
    default: '', // Additional contact info
  },
  address: {
    type: String,
    default: '', // Business address
  },
  // Social media handles for viral marketing
  instagram: {
    type: String,
    default: '', // Instagram handle (without @)
    trim: true,
    lowercase: true,
  },
  tiktok: {
    type: String,
    default: '', // TikTok handle (without @)
    trim: true,
    lowercase: true,
  },
  twitter: {
    type: String,
    default: '', // Twitter/X handle (without @)
    trim: true,
    lowercase: true,
  },
  facebook: {
    type: String,
    default: '', // Facebook page name or handle
    trim: true,
  },
  youtube: {
    type: String,
    default: '', // YouTube channel handle or ID
    trim: true,
  },
  website: {
    type: String,
    default: '', // Business website URL
    trim: true,
  },
  // Marketing preferences
  enableSocialMarketing: {
    type: Boolean,
    default: true, // Show social media section on receipts
  },
  enableShareIncentive: {
    type: Boolean,
    default: true, // Show share incentive message
  },
  shareIncentiveText: {
    type: String,
    default: '🎁 Share this receipt & get 5% off your next purchase!',
  },
  // Subscription details
  plan: {
    type: String,
    enum: ["free", "premium"],
    default: "free",
  },
  expiresOn: {
    type: Date,
    default: null, // Only set if subscribed
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
VendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for getting social media handles that are not empty
VendorSchema.virtual('activeSocials').get(function() {
  const socials = [];
  if (this.instagram) socials.push({ platform: 'instagram', handle: this.instagram });
  if (this.tiktok) socials.push({ platform: 'tiktok', handle: this.tiktok });
  if (this.twitter) socials.push({ platform: 'twitter', handle: this.twitter });
  if (this.facebook) socials.push({ platform: 'facebook', handle: this.facebook });
  if (this.youtube) socials.push({ platform: 'youtube', handle: this.youtube });
  return socials;
});

// Method to check if vendor has any social media configured
VendorSchema.methods.hasSocialMedia = function() {
  return !!(this.instagram || this.tiktok || this.twitter || this.facebook || this.youtube);
};

// Method to get formatted social media URLs
VendorSchema.methods.getSocialUrls = function() {
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