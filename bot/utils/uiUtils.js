// /bot/utils/uiUtils.js
// Shared UI utility functions for all WhatsApp bot commands

const UIUtils = {
    // Create beautiful dividers
    divider: (char = '━', length = 25) => char.repeat(length),
    
    // Create formatted headers
    header: (title, emoji = '🎯') => {
      const divider = UIUtils.divider('═', 30);
      return `${divider}\n${emoji} *${title.toUpperCase()}* ${emoji}\n${divider}`;
    },
    
    // Create sub-headers
    subHeader: (title, emoji = '📋') => `\n${emoji} *${title}*\n${UIUtils.divider('─', 20)}`,
    
    // Create beautiful cards
    card: (title, content, emoji = '💳') => {
      const maxLength = 25;
      const titlePadding = ' '.repeat(Math.max(0, maxLength - title.length));
      const contentPadding = ' '.repeat(Math.max(0, maxLength - content.toString().length));
      
      return `┌${UIUtils.divider('─', 28)}┐\n│ ${emoji} *${title}*${titlePadding}│\n├${UIUtils.divider('─', 28)}┤\n│ ${content}${contentPadding}│\n└${UIUtils.divider('─', 28)}┘`;
    },
    
    // Create command cards
    commandCard: (command, description, example = '', emoji = '🔧') => {
      const header = `┌${UIUtils.divider('─', 35)}┐`;
      const commandLine = `│ ${emoji} *${command}* ${' '.repeat(Math.max(0, 30 - command.length))}│`;
      const separator = `├${UIUtils.divider('─', 35)}┤`;
      const descLine = `│ ${description}${' '.repeat(Math.max(0, 32 - description.length))}│`;
      const footer = `└${UIUtils.divider('─', 35)}┘`;
      
      let card = `${header}\n${commandLine}\n${separator}\n${descLine}`;
      
      if (example) {
        const exampleLine = `│ 💡 ${example}${' '.repeat(Math.max(0, 29 - example.length))}│`;
        card += `\n${exampleLine}`;
      }
      
      return `${card}\n${footer}`;
    },
    
    // Create success message
    success: (message) => `✅ *SUCCESS*\n\n${message}`,
    
    // Create error message
    error: (message) => `❌ *ERROR*\n\n${message}`,
    
    // Create warning message
    warning: (message) => `⚠️ *WARNING*\n\n${message}`,
    
    // Create info message
    info: (message) => `ℹ️ *INFO*\n\n${message}`,
    
    // Create menu items
    menuItem: (number, title, description, emoji = '▶️') => {
      return `${emoji} *${number}. ${title}*\n   ${description}`;
    },
    
    // Create beautiful lists
    listItem: (item, emoji = '• ') => `${emoji} ${item}`,
    
    // Create status badges
    badge: (text, type = 'default') => {
      const badges = {
        success: '🟢',
        error: '🔴',
        warning: '🟡',
        info: '🔵',
        default: '⚪',
        premium: '💎',
        free: '🆓'
      };
      return `${badges[type]} ${text}`;
    },
    
    // Format currency (Nigerian Naira)
    formatCurrency: (amount, currency = '₦') => {
      return `${currency}${Number(amount).toLocaleString()}`;
    },
    
    // Create feature highlight
    feature: (title, description, isPremium = false) => {
      const badge = isPremium ? UIUtils.badge('Premium', 'premium') : UIUtils.badge('Free', 'free');
      return `${badge} *${title}*\n   ${description}`;
    },
    
    // Create confirmation box
    confirmationBox: (title, message, actions = []) => {
      const maxLength = 30;
      const titlePadding = ' '.repeat(Math.max(0, maxLength - title.length));
      const messagePadding = ' '.repeat(Math.max(0, maxLength - message.length));
      
      const box = `┌${UIUtils.divider('─', 35)}┐\n│ ⚠️  *${title}*${titlePadding}│\n├${UIUtils.divider('─', 35)}┤\n│ ${message}${messagePadding}│\n└${UIUtils.divider('─', 35)}┘`;
      
      if (actions.length > 0) {
        return `${box}\n\n${actions.map(action => UIUtils.listItem(action)).join('\n')}`;
      }
      return box;
    },
    
    // Create progress indicator
    progress: (message, percentage = 0) => {
      const barLength = 20;
      const filled = Math.round((percentage / 100) * barLength);
      const empty = barLength - filled;
      const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
      
      return `${message}\n\n[${progressBar}] ${percentage}%`;
    },
    
    // Create receipt layout
    receipt: (items, total, customer = '', note = '') => {
      const header = `┌${UIUtils.divider('─', 35)}┐\n│           📧 RECEIPT            │\n├${UIUtils.divider('─', 35)}┤`;
      
      const itemsList = items.map(item => 
        `│ ${item.name.padEnd(20)} ₦${item.price.toLocaleString().padStart(8)} │`
      ).join('\n');
      
      const separator = `├${UIUtils.divider('─', 35)}┤`;
      const totalLine = `│ ${'TOTAL'.padEnd(20)} ₦${total.toLocaleString().padStart(8)} │`;
      
      let receipt = `${header}\n${itemsList}\n${separator}\n${totalLine}`;
      
      if (customer) {
        receipt += `\n│ Customer: ${customer.padEnd(22)} │`;
      }
      
      if (note) {
        receipt += `\n│ Note: ${note.padEnd(26)} │`;
      }
      
      receipt += `\n└${UIUtils.divider('─', 35)}┘`;
      
      return receipt;
    }
  };
  
  module.exports = { UIUtils };