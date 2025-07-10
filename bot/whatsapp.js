// bot/whatsapp.js
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { handleOnboarding } = require('./commands/onboarding');
const { handleReceiptCommand } = require('./commands/receipt');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    if (!text) return;

    if (text.toLowerCase().startsWith('/receipt')) {
      await handleReceiptCommand(sock, msg, from);
    } else {
      await handleOnboarding(sock, msg, from, text);
    }
  });
}

startBot();
