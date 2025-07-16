// services/socket.js
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

let sockInstance = null;

async function connectWhatsApp() {
  if (sockInstance) return sockInstance;

  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../auth'));
  sockInstance = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });

  sockInstance.ev.on('creds.update', saveCreds);
  sockInstance.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      console.warn('⚠️ WhatsApp disconnected. Reconnecting...');
      sockInstance = null;
    }
  });

  return sockInstance;
}

module.exports = { connectWhatsApp };
