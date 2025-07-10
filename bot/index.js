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
const { handleReceipt } = require('./commands/receipt');
const { handleSalesToday } = require('./commands/salesToday');
const { handleSalesMonth } = require('./commands/salesMonth');
const { handleSubscribe } = require('./commands/subscribe');
const { handleHelp } = require('./commands/help');

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

    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection closed. Reconnect?', shouldReconnect);
      if (shouldReconnect) startBot();
    }

    if (connection === 'open') {
      console.log('✅ Bot is connected to WhatsApp');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages?.[0]) return;

    const msg = messages[0];
    const from = msg.key.remoteJid;
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      '';

    const db = getDB();
    const vendor = await db.collection('vendors').findOne({ phone: from });

    // Onboarding
    if (!vendor && !onboardingStates.has(from)) {
      return handleOnboarding(sock, msg, from, text);
    }

    if (onboardingStates.has(from)) {
      return handleOnboarding(sock, msg, from, text);
    }

    // Commands
    const lower = text.toLowerCase();

    if (lower.startsWith('/receipt')) {
      return handleReceipt(sock, msg, from, text, vendor);
    } else if (lower === '/sales today') {
      return handleSalesToday(sock, from);
    } else if (lower === '/sales month') {
      return handleSalesMonth(sock, from);
    } else if (lower === '/subscribe') {
      return handleSubscribe(sock, from);
    } else if (lower === '/help') {
      return handleHelp(sock, from);
    } else {
      return sock.sendMessage(from, {
        text: `🤖 I didn’t understand that.\nType */help* to see what I can do.`,
      });
    }
  });
}

startBot();
