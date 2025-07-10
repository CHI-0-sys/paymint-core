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
      await sock.sendMessage(from, {
        text: `📱 What's your Twitter/X handle?\n\n_Type "skip" to skip this step_`,
      });
      state.step++;
      break;

    case 8:
      if (text.toLowerCase().trim() === 'skip') {
        state.data.twitter = '';
      } else {
        // Clean Twitter handle (remove @ if present)
        state.data.twitter = text.trim().replace('@', '').toLowerCase();
      }
      await sock.sendMessage(from, {
        text: `📱 What's your Facebook page name?\n\n_Type "skip" to skip this step_`,
      });
      state.step++;
      break;

    case 9:
      if (text.toLowerCase().trim() === 'skip') {
        state.data.facebook = '';
      } else {
        state.data.facebook = text.trim().toLowerCase();
      }
      await sock.sendMessage(from, {
        text: `🌐 Do you have a business website?\n\n_Type "skip" to skip this step_`,
      });
      state.step++;
      break;

    case 10:
      if (text.toLowerCase().trim() === 'skip') {
        state.data.website = '';
      } else {
        // Add https:// if not present
        let website = text.trim();
        if (website && !website.startsWith('http')) {
          website = `https://${website}`;
        }
        state.data.website = website;
      }
      
      // Marketing preferences setup
      await sock.sendMessage(from, {
        text: `🎁 *Marketing Boost Setup*\n\nWould you like to show a share incentive on your receipts to encourage customers to share and bring more business?\n\nExample: "🎁 Share this receipt & get 5% off your next purchase!"\n\nReply *yes* to enable or *no* to disable`,
      });
      state.step++;
      break;

    case 11:
      const enableIncentive = text.toLowerCase().trim() === 'yes';
      state.data.enableShareIncentive = enableIncentive;
      
      if (enableIncentive) {
        await sock.sendMessage(from, {
          text: `💬 What incentive message would you like to show?\n\nExample: "🎁 Share this receipt & get 5% off your next purchase!"\n\n_Or type "default" to use our suggested message_`,
        });
        state.step++;
      } else {
        state.data.shareIncentiveText = '';
        // Skip to completion
        await completeOnboarding(sock, from, state);
        return;
      }
      break;

    case 12:
      if (text.toLowerCase().trim() === 'default') {
        state.data.shareIncentiveText = '🎁 Share this receipt & get 5% off your next purchase!';
      } else {
        state.data.shareIncentiveText = text.trim();
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
  
  // 🧠 Only set state if onboarding is still in progress
  if (state.step <= 12) {
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
      instagram: state.data.instagram || '',
      tiktok: state.data.tiktok || '',
      twitter: state.data.twitter || '',
      facebook: state.data.facebook || '',
      website: state.data.website || '',
      enableSocialMarketing: !!(state.data.instagram || state.data.tiktok || state.data.twitter || state.data.facebook),
      enableShareIncentive: state.data.enableShareIncentive || false,
      shareIncentiveText: state.data.shareIncentiveText || '',
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

    // ✅ Onboarding complete — remove state
    onboardingStates.delete(from);
    
    // Send completion message with summary
    let socialSummary = '';
    const socials = [];
    if (state.data.instagram) socials.push(`📷 Instagram: @${state.data.instagram}`);
    if (state.data.tiktok) socials.push(`🎵 TikTok: @${state.data.tiktok}`);
    if (state.data.twitter) socials.push(`🐦 Twitter: @${state.data.twitter}`);
    if (state.data.facebook) socials.push(`📘 Facebook: ${state.data.facebook}`);
    if (state.data.website) socials.push(`🌐 Website: ${state.data.website}`);
    
    if (socials.length > 0) {
      socialSummary = `\n\n📱 *Your Social Media:*\n${socials.join('\n')}`;
    }
    
    const incentiveInfo = state.data.enableShareIncentive 
      ? `\n\n🎁 *Share Incentive:* ${state.data.shareIncentiveText}`
      : '';

    await sock.sendMessage(from, {
      text: `✅ *Business Setup Complete!*\n\n🏢 *${state.data.businessName}*\n📞 ${state.data.contact}\n📍 ${state.data.address}${socialSummary}${incentiveInfo}\n\n🎯 *Your receipts will now include:*\n• ✅ Verification badge\n• 📱 Social media links (if added)\n• 🎁 Share incentives (if enabled)\n• 📊 Professional barcode\n\n*Type /receipt anytime to create a receipt.*\n*Type /settings to update your business info.*`,
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