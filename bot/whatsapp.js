// bot/whatsapp.js
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { handleOnboarding } = require('./commands/onboarding');
const { handleReceiptCommand } = require('./commands/receipt');

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      // Add timeout configurations
      connectTimeoutMs: 60000, // 60 seconds
      defaultQueryTimeoutMs: 60000, // 60 seconds
      qrTimeout: 60000,
      // Add additional options for stability
      keepAliveIntervalMs: 30000,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      // Browser info
      browser: ['PayMint Bot', 'Chrome', '1.0.0'],
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log('Connection closed due to:', lastDisconnect?.error);
        
        if (shouldReconnect) {
          console.log('Reconnecting...');
          setTimeout(() => {
            startBot(); // Restart the bot
          }, 5000); // Wait 5 seconds before reconnecting
        } else {
          console.log('Logged out, please scan QR code again');
        }
      } else if (connection === 'open') {
        console.log('WhatsApp bot connected successfully!');
      }
    });

    // Handle messages with error handling
    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0];
        
        // Skip if message is from status broadcast
        if (msg.key.remoteJid === 'status@broadcast') return;
        
        // Skip if message is from self
        if (msg.key.fromMe) return;
        
        const from = msg.key.remoteJid;
        const text = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.imageMessage?.caption ||
                    msg.message?.videoMessage?.caption;
        
        if (!text) return;
        
        console.log(`Received message from ${from}: ${text}`);
        
        // Handle commands
        if (text.toLowerCase().startsWith('/receipt')) {
          await handleReceiptCommand(sock, msg, from);
        } else {
          await handleOnboarding(sock, msg, from, text);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        
        // Try to send error message to user (optional)
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: 'Sorry, there was an error processing your message. Please try again later.'
          });
        } catch (sendError) {
          console.error('Failed to send error message:', sendError);
        }
      }
    });

    return sock;
  } catch (error) {
    console.error('Error starting bot:', error);
    
    // Retry after 10 seconds
    setTimeout(() => {
      console.log('Retrying bot startup...');
      startBot();
    }, 10000);
  }
}

// Utility function for retrying operations
async function retryOperation(operation, maxRetries = 3, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

// Enhanced message sending with retry
async function sendMessageWithRetry(sock, jid, message, maxRetries = 3) {
  return retryOperation(async () => {
    return await sock.sendMessage(jid, message);
  }, maxRetries);
}

// Start the bot
startBot().catch(console.error);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down bot...');
  process.exit(0);
});

// Export for use in other files
module.exports = { sendMessageWithRetry, retryOperation };