// bot/utils/logger.js
function logEvent(type, details) {
    const time = new Date().toISOString();
    console.log(`[${time}] ${type.toUpperCase()} →`, details);
  }
  
  module.exports = { logEvent };
  