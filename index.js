const { privateKeys } = require('./config/env');
const { initializeWallet } = require('./utils/wallet');
const { selectNetwork, showMenu, rl } = require('./services/menu');
const { NETWORKS } = require('./config/constants');
const { EMOJI, colorText, COLORS } = require('./utils/colors');

async function main() {
  try {
    console.log('\n----------------------------------------');
    console.log(`${colorText('    R2 Money - HiddenGem  t.me/hiddengemnews', COLORS.CYAN)}`);
    console.log('----------------------------------------');
    
    console.log(`${EMOJI.INFO} ${colorText(`Loaded ${privateKeys.length} private keys from .env`, COLORS.GREEN)}`);
    
    while (true) {
      const networkKey = await selectNetwork();
      console.log(`${EMOJI.INFO} ${colorText(`USDC/R2USD/sR2USD Bot Starting on ${networkKey}...`, COLORS.GREEN)}`);
      const wallets = [];
      for (const privateKey of privateKeys) {
        try {
          const { wallet } = await initializeWallet(privateKey, networkKey);
          wallets.push(wallet);
        } catch (error) {
          console.error(`${EMOJI.ERROR} ${colorText(`Failed to initialize wallet for key ${privateKey.slice(0, 6)}... on ${networkKey}`, COLORS.RED)}`, error);
        }
      }
      if (wallets.length === 0) {
        console.error(`${EMOJI.ERROR} ${colorText('No valid wallets initialized for this network. Please try another network.', COLORS.RED)}`);
        continue;
      }
      if (!wallets[0].networkKey || !NETWORKS[wallets[0].networkKey]) {
        console.error(`${EMOJI.ERROR} ${colorText(`Invalid network key: ${wallets[0].networkKey || 'undefined'}. Please try again.`, COLORS.RED)}`);
        continue;
      }
      let continueMenu = true;
      while (continueMenu) {
        const result = await showMenu(wallets);
        if (result.action === 'exit') {
          rl.close();
          return;
        } else if (result.action === 'changeNetwork') {
          continueMenu = false; 
        } else {
        }
      }
    }
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred:', COLORS.RED)}`, error);
    rl.close();
  }
}

rl.on('close', () => {
  console.log(`${EMOJI.INFO} ${colorText('Application exited.', COLORS.GRAY)}`);
  process.exit(0);
});

main();
