const Vendor = require("../../models/Vendor");

// Track users currently going through onboarding
const onboardingStates = new Map();

async function handleOnboarding(sock, msg, from, text) {
  let state = onboardingStates.get(from) || { step: 0, data: {} };
  
  switch (state.step) {
    case 0:
      await sock.sendMessage(from, {
        text: `👋🏽 Welcome to Paymint! Let's set up your business.\n\nWhat's your first name Boss?`,
      });
      state.step++;
      break;

    case 1:
      state.data.name = text.trim();
      await sock.sendMessage(from, {
        text: `📛 Nice to meet you, ${state.data.name}!\n\nWhat's your business name?`,
      });
      state.step++;
      break;

    case 2:
      state.data.businessName = text.trim();
      await sock.sendMessage(from, {
        text: `📞 What's your business contact line?`,
      });
      state.step++;
      break;

    case 3:
      state.data.contact = text.trim();
      await sock.sendMessage(from, {
        text: `📍 What's your business address?`,
      });
      state.step++;
      break;

    case 4:
      state.data.address = text.trim();
      await sock.sendMessage(from, {
        text: `📝 Add a short description of your business.`,
      });
      state.step++;
      break;

    case 5:
      state.data.description = text.trim();
      await sock.sendMessage(from, {
        text: `📱 *Social Media Setup* (Optional but Recommended!)\n\n🎯 Adding your social media will help customers find and follow you, boosting your business visibility!\n\nWhat's your Instagram handle?\n\n_Type "skip" to skip this step_`,
      });
      state.step++;
      break;

    case 6:
      if (text.toLowerCase().trim() === 'skip') {
        state.data.instagram = '';
      } else {
        // Clean Instagram handle (remove @ if present)
        state.data.instagram = text.trim().replace('@', '').toLowerCase();
      }
      await sock.sendMessage(from, {
        text: `📱 What's your TikTok handle?\n\n_Type "skip" to skip this step_`,
      });
      state.step++;
      break;

    case 7:
      if (text.toLowerCase().trim() === 'skip') {
        state.data.tiktok = '';
      } else {
        // Clean TikTok handle (remove @ if present)
        state.data.tiktok = text.trim().replace('@', '').toLowerCase();
      }
      
      // Complete onboarding
      await completeOnboarding(sock, from, state);
      return;

    default:
      // Reset if something goes wrong
      onboardingStates.delete(from);
      await sock.sendMessage(from, {
        text: `❌ Something went wrong. Please start over by typing /start`,
      });
      return;
  }
  
  // Only set state if onboarding is still in progress
  if (state.step <= 7) {
    onboardingStates.set(from, state);
  }
}

async function completeOnboarding(sock, from, state) {
  try {
    // Save to DB
    const existing = await Vendor.findOne({ phone: from });
    
    const vendorData = {
      businessName: state.data.businessName,
      contact: state.data.contact,
      address: state.data.address,
      description: state.data.description,
      instagram: state.data.instagram || '',
      tiktok: state.data.tiktok || '',
      enableSocialMarketing: !!(state.data.instagram || state.data.tiktok),
      updatedAt: new Date(),
    };
  
    if (existing) {
      await Vendor.updateOne({ phone: from }, { $set: vendorData });
    } else {
      await Vendor.create({
        phone: from,
        ...vendorData,
        plan: "free",
        createdAt: new Date(),
      });
    }

    // Onboarding complete — remove state
    onboardingStates.delete(from);
    
    // Send completion message with summary
    let socialSummary = '';
    const socials = [];
    if (state.data.instagram) socials.push(`📷 Instagram: @${state.data.instagram}`);
    if (state.data.tiktok) socials.push(`🎵 TikTok: @${state.data.tiktok}`);
    
    if (socials.length > 0) {
      socialSummary = `\n\n📱 *Your Social Media:*\n${socials.join('\n')}`;
    }

    await sock.sendMessage(from, {
      text: `✅ *Business Setup Complete!*\n\n🏢 *${state.data.businessName}*\n📞 ${state.data.contact}\n📍 ${state.data.address}${socialSummary}\n\n🎯 *Your receipts will now include:*\n• ✅ Verification badge\n• 📱 Social media links (if added)\n• 📊 Professional barcode\n\n*Type /receipt anytime to create a receipt.*\n*Type /settings to update your business info.*`,
    });
    
  } catch (error) {
    console.error('Error completing onboarding:', error);
    await sock.sendMessage(from, {
      text: `❌ There was an error saving your information. Please try again by typing /start`,
    });
  }
}

// Function to check if user is in onboarding
function isInOnboarding(from) {
  return onboardingStates.has(from);
}

// Function to get current onboarding step
function getOnboardingStep(from) {
  const state = onboardingStates.get(from);
  return state ? state.step : null;
}

// Function to cancel onboarding
function cancelOnboarding(from) {
  onboardingStates.delete(from);
}

module.exports = { 
  handleOnboarding, 
  onboardingStates, 
  isInOnboarding, 
  getOnboardingStep, 
  cancelOnboarding 
};