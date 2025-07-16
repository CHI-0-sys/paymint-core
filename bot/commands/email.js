const { UIUtils } = require("../utils/uiUtils");
const emailStates = new Map(); // Temporarily track users adding email

async function handleEmailCommand(sock, msg, from, text, vendor) {
  const email = text.split(" ")[1];

  if (!email) {
    emailStates.set(from, true); // Expect next message to be the email
    return await sock.sendMessage(from, {
      text: `📧 *Enter your email address*\n\nPlease reply with your email.`
    });
  }

  // If email is included in the command: /email someone@example.com
  return await saveEmail(email, from, sock);
}

async function handleEmailFollowUp(sock, msg, from, text) {
  if (!emailStates.has(from)) return false;

  emailStates.delete(from);
  return await saveEmail(text.trim(), from, sock);
}

async function saveEmail(email, from, sock) {
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return await sock.sendMessage(from, {
      text: UIUtils.error("Invalid email address. Please try again.")
    });
  }

  const db = require("../../services/db").getDB();
  await db.collection("vendors").updateOne(
    { phone: from },
    { $set: { email } },
    { upsert: true }
  );

  return await sock.sendMessage(from, {
    text: UIUtils.success(`Your email has been saved as:\n\n📧 *${email}*`)
  });
}

module.exports = {
  handleEmailCommand,
  handleEmailFollowUp,
  emailStates
};
