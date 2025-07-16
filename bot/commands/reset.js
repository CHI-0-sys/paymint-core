// reset.js

const { getDB } = require("../../services/db");

const UIUtils = {
  warning: (text) => `⚠️ *WARNING*\n\n${text}`,
  success: (text) => `✅ *SUCCESS*\n\n${text}`,
  info: (text) => `ℹ️ *INFO*\n\n${text}`,
  error: (text) => `❌ *ERROR*\n\n${text}`
};

// Store user confirmation state (optional for tracking multiple sessions)
const resetStates = new Map();

async function handleReset(sock, msg, from, text, vendor) {
  resetStates.set(from, true); // mark that user is in reset flow

  const warningText = UIUtils.warning(`Are you sure you want to reset your vendor profile?

This will:
• 🗑️ Delete your vendor account
• ⚠️ This action cannot be undone

*Please confirm below:*`);

  const buttons = [
    {
      buttonId: "reset_confirm",
      buttonText: { displayText: "✅ Yes, Reset" },
      type: 1,
    },
    {
      buttonId: "reset_cancel",
      buttonText: { displayText: "❌ Cancel" },
      type: 1,
    },
  ];

  await sock.sendMessage(from, {
    text: warningText,
    buttons,
    headerType: 1,
  });
}

async function handleResetButton(sock, msg, from, buttonId) {
  const db = getDB();

  if (buttonId === "reset_confirm") {
    // Delete the vendor account
    await db.collection("vendors").deleteOne({ phone: from });

    await sock.sendMessage(from, {
      text: UIUtils.success("Your vendor profile has been successfully deleted."),
    });
  } else if (buttonId === "reset_cancel") {
    await sock.sendMessage(from, {
      text: UIUtils.info("Reset cancelled. Your profile is safe."),
    });
  }

  resetStates.delete(from);
}

module.exports = {
  handleReset,
  handleResetButton
};