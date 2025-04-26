require('dotenv').config();
const fs = require('fs');
const { EMOJI, colorText, COLORS } = require('../utils/colors');

let proxies = [];
let privateKeys = [];

function isValidPrivateKey(key) {
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  return /^[0-9a-fA-F]{64}$/.test(cleanKey);
}

try {
  if (fs.existsSync('./proxies.txt')) {
    proxies = fs.readFileSync('./proxies.txt', 'utf8')
      .split('\n')
      .filter(line => line.trim().length > 0);
  } else {
    console.log(`${EMOJI.WARNING} ${colorText('proxies.txt not found. Will connect directly.', COLORS.YELLOW)}`);
  }
} catch (error) {
  console.error(`${EMOJI.ERROR} ${colorText('Failed to load proxies:', COLORS.RED)}`, error);
}

try {
  const envKeys = Object.keys(process.env).filter(key => key.startsWith('PRIVATE_KEY_'));
  if (envKeys.length > 0) {
    privateKeys = envKeys
      .map(key => process.env[key])
      .filter(key => key && key.trim().length > 0)
      .filter(key => {
        if (!isValidPrivateKey(key)) {
          console.error(`${EMOJI.ERROR} ${colorText(`Invalid private key format for ${key.slice(0, 6)}...: must be 64 hex characters`, COLORS.RED)}`);
          return false;
        }
        return true;
      });
  }
  if (privateKeys.length === 0) {
    console.error(`${EMOJI.ERROR} ${colorText('No valid private keys found in .env (PRIVATE_KEY_*)', COLORS.RED)}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`${EMOJI.ERROR} ${colorText('Failed to load private keys from .env:', COLORS.RED)}`, error);
  process.exit(1);
}

module.exports = { proxies, privateKeys };
