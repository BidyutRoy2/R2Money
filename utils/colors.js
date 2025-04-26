const COLORS = {
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    RED: '\x1b[31m',
    WHITE: '\x1b[37m',
    GRAY: '\x1b[90m',
    CYAN: '\x1b[36m',
    RESET: '\x1b[0m'
  };
  
  const EMOJI = {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    MONEY: '💰',
    SWAP: '🔄',
    STAKE: '📌',
    WALLET: '👛',
    LOADING: '⏳',
    CLOCK: '⏰'
  };
  
  const colorText = (text, color) => `${color}${text}${COLORS.RESET}`;
  
  module.exports = { COLORS, EMOJI, colorText };
