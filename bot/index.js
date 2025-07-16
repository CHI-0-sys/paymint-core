require('dotenv').config();
require('../config/env');
require('../config/mongo');
require('../bot/utils/checkPlan');

const path = require('path');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const { getDB, connectDB } = require('../services/db');
const { handleOnboarding, onboardingStates } = require('./commands/onboarding');
const { handleSalesToday } = require('./commands/salesToday');
const { handleSalesMonth } = require('./commands/salesMonth');
const { 
  handleSubscribe, 
  handleCardPayment, 
  handleBankTransfer, 
  handleAllPaymentMethods,
  handleSubscriptionStatus 
} = require('./commands/subscribe');
const { handleHelp } = require('./commands/help');
const { handleButtonClick, handleReceipt } = require('./commands/receipt');
const { handleReset, handleResetButton } = require('./commands/reset');
const { handleEmailCommand, handleEmailFollowUp, emailStates } = require('./commands/email');

const UIUtils = {
  divider: (char = '━', length = 25) => char.repeat(length),
  header: (title, emoji = '🎯') => {
    const divider = UIUtils.divider('═', 30);
    return `${divider}\n${emoji} *${title.toUpperCase()}* ${emoji}\n${divider}`;
  },
  subHeader: (title, emoji = '📋') => `\n${emoji} *${title}*\n${UIUtils.divider('─', 20)}`,
  formatCurrency: (amount, currency = '₦') => `${currency}${Number(amount).toLocaleString()}`,
  card: (title, content, emoji = '💳') => {
    return `┌${UIUtils.divider('─', 28)}┐\n│ ${emoji} *${title}* ${' '.repeat(Math.max(0, 20 - title.length))}│\n├${UIUtils.divider('─', 28)}┤\n│ ${content}${' '.repeat(Math.max(0, 25 - content.length))}│\n└${UIUtils.divider('─', 28)}┘`;
  },
  success: (message) => `✅ *SUCCESS*\n\n${message}`,
  error: (message) => `❌ *ERROR*\n\n${message}`,
  warning: (message) => `⚠️ *WARNING*\n\n${message}`,
  info: (message) => `ℹ️ *INFO*\n\n${message}`,
  menuItem: (number, title, description, emoji = '▶️') => `${emoji} *${number}. ${title}*\n   ${description}`,
  listItem: (item, emoji = '• ') => `${emoji} ${item}`,
  badge: (text, type = 'default') => {
    const badges = {
      success: '🟢', error: '🔴', warning: '🟡', info: '🔵', default: '⚪'
    };
    return `${badges[type]} ${text}`;
  }
};

function isValidJid(jid) {
  return typeof jid === 'string' && (jid.includes('@s.whatsapp.net') || jid.includes('@g.us'));
}

async function startBot() {
  await connectDB();
  const authFolder = path.join(__dirname, '../auth_state');
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'info' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Scan the QR code below to connect:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection closed. Reconnect?', shouldReconnect);
      if (shouldReconnect) startBot();
    }

    if (connection === 'open') {
      console.log('✅ Bot is connected to WhatsApp');
      console.log('🎉 Ready to serve customers!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages?.[0]) return;

    const msg = messages[0];
    const from = msg.key.remoteJid;
    if (!isValidJid(from) || !msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text || '';

    const db = getDB();
    const vendor = await db.collection('vendors').findOne({ phone: from });

    // Handle button responses
    if (msg.message.buttonsResponseMessage) {
      const buttonId = msg.message.buttonsResponseMessage.selectedButtonId;

      if (buttonId === 'reset_confirm' || buttonId === 'reset_cancel') {
        return handleResetButton(sock, msg, from, buttonId);
      }

      if (vendor && buttonId) {
        return handleButtonClick(sock, msg, from, buttonId, vendor);
      }
    }

    // Handle list responses
    if (msg.message.listResponseMessage) {
      const listId = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
      if (vendor && listId) {
        return handleButtonClick(sock, msg, from, listId, vendor);
      }
    }

    // Handle new users (onboarding)
    if (!vendor && !onboardingStates.has(from)) {
      await sock.sendMessage(from, { 
        text: `${UIUtils.header('Welcome to Paymint!', '🎉')}\n\nI'm your personal business assistant. Let me help you set up your business profile and start generating receipts for your customers!\n\nType anything to begin setup...` 
      });
      return handleOnboarding(sock, msg, from, text);
    }

    // Handle ongoing onboarding
    if (onboardingStates.has(from)) {
      return handleOnboarding(sock, msg, from, text);
    } 

    // Handle email follow-up
    if (emailStates.has(from)) {
      return await handleEmailFollowUp(sock, msg, from, text); 
    }

    const lower = text.toLowerCase().trim();

    try {
      // Payment Commands
      if (lower === '/subscribe') {
        return handleSubscribe(sock, msg, from);
      } else if (lower === '/card') {
        return handleCardPayment(sock, msg, from);
      } else if (lower === '/transfer') {
        return handleBankTransfer(sock, msg, from);
      } else if (lower === '/pay') {
        return handleAllPaymentMethods(sock, msg, from);
      } else if (lower === '/status') {
        return handleSubscriptionStatus(sock, msg, from);
      }
      
      // Email Commands
      else if (lower.startsWith('/email')) {
        return await handleEmailCommand(sock, msg, from, text, vendor);
      }
      
      // Receipt Commands
      else if (lower.startsWith('/receipt')) {
        return handleReceipt(sock, msg, from, text, vendor);
      }
      
      // Sales Commands
      else if (lower === '/sales today') {
        return handleSalesToday(sock, from);
      } else if (lower === '/sales month') {
        return handleSalesMonth(sock, from);
      }
      
      // Utility Commands
      else if (lower === '/reset') {
        return handleReset(sock, msg, from, text, vendor);
      } else if (lower === '/help') {
        const helpMessage = `${UIUtils.header('Paymint Commands', '📋')}\n\n` +
          `${UIUtils.subHeader('💰 Payment Commands')}\n` +
          `${UIUtils.menuItem('1', 'Subscribe', 'Upgrade to premium plan', '💎')}\n` +
          `${UIUtils.menuItem('2', 'Card', 'Pay with debit/credit card', '💳')}\n` +
          `${UIUtils.menuItem('3', 'Transfer', 'Pay via bank transfer', '🏦')}\n` +
          `${UIUtils.menuItem('4', 'Pay', 'All payment methods', '💸')}\n` +
          `${UIUtils.menuItem('5', 'Status', 'Check subscription status', '📊')}\n\n` +
          `${UIUtils.subHeader('🧾 Receipt Commands')}\n` +
          `${UIUtils.menuItem('6', 'Receipt', 'Generate customer receipt', '📄')}\n\n` +
          `${UIUtils.subHeader('📈 Sales Commands')}\n` +
          `${UIUtils.menuItem('7', 'Sales Today', 'View today\'s sales', '📊')}\n` +
          `${UIUtils.menuItem('8', 'Sales Month', 'View monthly sales', '📈')}\n\n` +
          `${UIUtils.subHeader('⚙️ Settings')}\n` +
          `${UIUtils.menuItem('9', 'Email', 'Update business email', '📧')}\n` +
          `${UIUtils.menuItem('10', 'Reset', 'Reset business data', '🔄')}\n` +
          `${UIUtils.menuItem('11', 'Help', 'Show this help menu', '❓')}\n\n` +
          `${UIUtils.info('Type any command to get started!')}`;
        
        await sock.sendMessage(from, { text: helpMessage });
        return;
      } else {
        const unknownMessage = `${UIUtils.warning('Unknown Command')}\n\n` +
          `I don't recognize that command. Here are some options:\n\n` +
          `${UIUtils.listItem('/help - Show all commands')}\n` +
          `${UIUtils.listItem('/subscribe - Upgrade to premium')}\n` +
          `${UIUtils.listItem('/receipt - Generate receipt')}\n` +
          `${UIUtils.listItem('/status - Check subscription')}\n\n` +
          `${UIUtils.info('Type /help for a complete list of commands.')}`;
        
        await sock.sendMessage(from, { text: unknownMessage });
        return;
      }
    } catch (error) {
      console.error('❌ Error handling command:', error);
      try {
        await sock.sendMessage(from, {
          text: UIUtils.error('Something went wrong. Please try again or contact support.\n\nType /help for available commands.')
        });
      } catch (sendError) {
        console.error('⚠️ Failed to send error message:', sendError);
      }
    }
  });
}

console.log(`${UIUtils.header('WhatsApp Business Bot', '🤖')}`);
console.log('🚀 Starting bot...');
console.log('📡 Connecting to WhatsApp...');

startBot().catch(error => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});

module.exports = {
  UIUtils
};