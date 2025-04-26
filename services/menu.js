const readline = require('readline');
const { swapUSDCtoR2USD, swapR2USDtoUSDC } = require('./swap');
const { stakeR2USD } = require('./stake');
const { checkBalance, checkEthBalance } = require('./blockchain');
const { dailyTasks, executeDailyTasks, startCountdown } = require('./dailyTasks');
const { NETWORKS } = require('../config/constants');
const { EMOJI, colorText, COLORS } = require('../utils/colors');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function selectNetwork() {
  console.log(`\n${colorText('========== Select Network ==========', COLORS.WHITE)}`);
  console.log(`1. ${colorText('Sepolia', COLORS.YELLOW)}`);
  console.log(`2. ${colorText('Arbitrum Sepolia', COLORS.YELLOW)}`);
  console.log(`${colorText('===================================', COLORS.WHITE)}`);
  return new Promise((resolve) => {
    rl.question(`${colorText('Select a network (1-2): ', COLORS.WHITE)}`, (option) => {
      switch (option) {
        case '1':
          resolve('sepolia');
          break;
        case '2':
          resolve('arbitrumSepolia');
          break;
        default:
          console.log(`${EMOJI.WARNING} ${colorText('Invalid option. Please select 1 or 2.', COLORS.YELLOW)}`);
          selectNetwork().then(resolve);
          break;
      }
    });
  });
}

async function showMenu(wallets) {
  if (!wallets || wallets.length === 0) {
    console.error(`${EMOJI.ERROR} ${colorText('No wallets available to display menu.', COLORS.RED)}`);
    return { action: 'exit' };
  }
  const networkKey = wallets[0].networkKey;
  if (!NETWORKS[networkKey]) {
    console.error(`${EMOJI.ERROR} ${colorText(`Invalid network: ${networkKey}.`, COLORS.RED)}`);
    return { action: 'exit' };
  }
  console.log(`\n${colorText(`========== USDC/R2USD/sR2USD Bot Menu (${NETWORKS[networkKey].name}) ==========`, COLORS.WHITE)}`);
  console.log(`1. ${EMOJI.SWAP} ${colorText('Swap USDC to R2USD', COLORS.YELLOW)}`);
  console.log(`2. ${EMOJI.SWAP} ${colorText('Swap R2USD to USDC', COLORS.YELLOW)}`);
  console.log(`3. ${EMOJI.STAKE} ${colorText('Stake R2USD to sR2USD', COLORS.YELLOW)}`);
  console.log(`4. ${EMOJI.MONEY} ${colorText('Check balances', COLORS.YELLOW)}`);
  console.log(`5. ${colorText('Setup Daily Swap and Stake', COLORS.YELLOW)}`);
  console.log(`6. ${colorText('Change Network', COLORS.YELLOW)}`);
  console.log(`7. ${colorText('Exit', COLORS.YELLOW)}`);
  console.log(`${colorText('=============================================', COLORS.WHITE)}`);
  
  return new Promise((resolve) => {
    rl.question(`${colorText('\nSelect an option (1-7): ', COLORS.WHITE)}`, async (option) => {
      switch (option) {
        case '1':
          await handleUSDCtoR2USDSwap(wallets);
          resolve({ action: 'continue' });
          break;
        case '2':
          await handleR2USDtoUSDCSwap(wallets);
          resolve({ action: 'continue' });
          break;
        case '3':
          await handleStakeR2USD(wallets);
          resolve({ action: 'continue' });
          break;
        case '4':
          await displayBalances(wallets);
          resolve({ action: 'continue' });
          break;
        case '5':
          await setupDailySwapAndStake(wallets);
          resolve({ action: 'continue' });
          break;
        case '6':
          console.log(`${EMOJI.INFO} ${colorText('Returning to network selection...', COLORS.GRAY)}`);
          resolve({ action: 'changeNetwork' });
          break;
        case '7':
          console.log(`${EMOJI.INFO} ${colorText('Exiting the application!', COLORS.GRAY)}`);
          resolve({ action: 'exit' });
          break;
        default:
          console.log(`${EMOJI.WARNING} ${colorText('Invalid option. Please select a number between 1 and 7.', COLORS.YELLOW)}`);
          resolve({ action: 'continue' });
          break;
      }
    });
  });
}

async function selectWallet(wallets) {
  if (wallets.length === 1) {
    console.log(`${EMOJI.WALLET} ${colorText(`Using wallet: ${wallets[0].address}`, COLORS.WHITE)}`);
    return wallets[0];
  }
  console.log(`${colorText('Available wallets:', COLORS.WHITE)}`);
  wallets.forEach((wallet, index) => {
    console.log(`${colorText(`${index + 1}. ${wallet.address}`, COLORS.YELLOW)}`);
  });
  return new Promise((resolve) => {
    rl.question(`${colorText('Select wallet number (or "all" to use all wallets): ', COLORS.WHITE)}`, (input) => {
      if (input.toLowerCase() === 'all') {
        resolve(wallets);
      } else {
        const index = parseInt(input) - 1;
        if (isNaN(index) || index < 0 || index >= wallets.length) {
          console.log(`${EMOJI.WARNING} ${colorText('Invalid selection. Using first wallet.', COLORS.YELLOW)}`);
          resolve(wallets[0]);
        } else {
          console.log(`${EMOJI.WALLET} ${colorText(`Using wallet: ${wallets[index].address}`, COLORS.WHITE)}`);
          resolve(wallets[index]);
        }
      }
    });
  });
}

async function displayBalances(wallets) {
  try {
    console.log(`\n${EMOJI.LOADING} ${colorText('Fetching balances for all wallets...', COLORS.YELLOW)}`);
    for (const wallet of wallets) {
      const { contracts } = NETWORKS[wallet.networkKey];
      console.log(`${colorText(`\nWallet: ${wallet.address} (${NETWORKS[wallet.networkKey].name})`, COLORS.WHITE)}`);
      const ethBalance = await checkEthBalance(wallet);
      const usdcBalance = await checkBalance(wallet, contracts.USDC_ADDRESS);
      const r2usdBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
      const sr2usdBalance = await checkBalance(wallet, contracts.SR2USD_ADDRESS);
      console.log(`${colorText('========== Current Balances ==========', COLORS.WHITE)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`${NETWORKS[wallet.networkKey].symbol}: ${ethBalance}`, COLORS.GREEN)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`USDC: ${usdcBalance}`, COLORS.GREEN)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`R2USD: ${r2usdBalance}`, COLORS.GREEN)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`sR2USD: ${sr2usdBalance}`, COLORS.GREEN)}`);
      console.log(`${colorText('======================================', COLORS.WHITE)}`);
    }
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to fetch balances:', COLORS.RED)}`, error);
  }
}

async function handleUSDCtoR2USDSwap(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];
    
    for (const wallet of walletList) {
      const { contracts } = NETWORKS[wallet.networkKey];
      const usdcBalance = await checkBalance(wallet, contracts.USDC_ADDRESS);
      console.log(`\n${EMOJI.MONEY} ${colorText(`Wallet ${wallet.address} - Current USDC balance: ${usdcBalance}`, COLORS.WHITE)}`);
    }
    
    rl.question(`${colorText('Enter amount of USDC to swap (or "back" to return to menu): ', COLORS.WHITE)}`, async (amount) => {
      if (amount.toLowerCase() === 'back') {
        await showMenu(wallets);
        return;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Please enter a positive number.', COLORS.RED)}`);
        await handleUSDCtoR2USDSwap(wallets);
        return;
      }
      rl.question(`${colorText('Enter number of swap transactions to perform per wallet (or "skip" to return to menu): ', COLORS.WHITE)}`, async (numTxs) => {
        if (numTxs.toLowerCase() === 'skip') {
          await showMenu(wallets);
          return;
        }
        const parsedNumTxs = parseInt(numTxs);
        if (isNaN(parsedNumTxs) || parsedNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Please enter a positive integer.', COLORS.RED)}`);
          await handleUSDCtoR2USDSwap(wallets);
          return;
        }
        for (const wallet of walletList) {
          console.log(`\n${colorText(`Processing wallet: ${wallet.address} (${NETWORKS[wallet.networkKey].name})`, COLORS.WHITE)}`);
          for (let i = 1; i <= parsedNumTxs; i++) {
            console.log(`${EMOJI.LOADING} ${colorText(`Executing USDC to R2USD swap transaction ${i} of ${parsedNumTxs} (Amount: ${parsedAmount} USDC)`, COLORS.YELLOW)}`);
            const success = await swapUSDCtoR2USD(wallet, parsedAmount);
            if (success) {
              console.log(`${EMOJI.SUCCESS} ${colorText(`Swap transaction ${i} completed successfully!`, COLORS.GREEN)}`);
            } else {
              console.error(`${EMOJI.ERROR} ${colorText(`Swap transaction ${i} failed. Continuing to next transaction.`, COLORS.RED)}`);
            }
          }
          console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${parsedNumTxs} USDC to R2USD swap transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
        }
        await showMenu(wallets);
      });
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred during USDC to R2USD swap process:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function handleR2USDtoUSDCSwap(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];
    
    for (const wallet of walletList) {
      const { contracts } = NETWORKS[wallet.networkKey];
      const r2usdBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
      console.log(`\n${EMOJI.MONEY} ${colorText(`Wallet ${wallet.address} - Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    }
    
    rl.question(`${colorText('Enter amount of R2USD to swap (or "back" to return to menu): ', COLORS.WHITE)}`, async (amount) => {
      if (amount.toLowerCase() === 'back') {
        await showMenu(wallets);
        return;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Please enter a positive number.', COLORS.RED)}`);
        await handleR2USDtoUSDCSwap(wallets);
        return;
      }
      rl.question(`${colorText('Enter number of swap transactions to perform per wallet (or "skip" to return to menu): ', COLORS.WHITE)}`, async (numTxs) => {
        if (numTxs.toLowerCase() === 'skip') {
          await showMenu(wallets);
          return;
        }
        const parsedNumTxs = parseInt(numTxs);
        if (isNaN(parsedNumTxs) || parsedNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Please enter a positive integer.', COLORS.RED)}`);
          await handleR2USDtoUSDCSwap(wallets);
          return;
        }
        for (const wallet of walletList) {
          console.log(`\n${colorText(`Processing wallet: ${wallet.address} (${NETWORKS[wallet.networkKey].name})`, COLORS.WHITE)}`);
          for (let i = 1; i <= parsedNumTxs; i++) {
            console.log(`${EMOJI.LOADING} ${colorText(`Executing R2USD to USDC swap transaction ${i} of ${parsedNumTxs} (Amount: ${parsedAmount} R2USD)`, COLORS.YELLOW)}`);
            const success = await swapR2USDtoUSDC(wallet, parsedAmount);
            if (success) {
              console.log(`${EMOJI.SUCCESS} ${colorText(`Swap transaction ${i} completed successfully!`, COLORS.GREEN)}`);
            } else {
              console.error(`${EMOJI.ERROR} ${colorText(`Swap transaction ${i} failed. Continuing to next transaction.`, COLORS.RED)}`);
            }
          }
          console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${parsedNumTxs} R2USD to USDC swap transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
        }
        await showMenu(wallets);
      });
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred during R2USD to USDC swap process:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function handleStakeR2USD(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];
    
    for (const wallet of walletList) {
      const { contracts } = NETWORKS[wallet.networkKey];
      const r2usdBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
      console.log(`\n${EMOJI.MONEY} ${colorText(`Wallet ${wallet.address} - Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    }
    
    rl.question(`${colorText('Enter amount of R2USD to stake (or "back" to return to menu): ', COLORS.WHITE)}`, async (amount) => {
      if (amount.toLowerCase() === 'back') {
        await showMenu(wallets);
        return;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Please enter a positive number.', COLORS.RED)}`);
        await handleStakeR2USD(wallets);
        return;
      }
      rl.question(`${colorText('Enter number of staking transactions to perform per wallet (or "skip" to return to menu): ', COLORS.WHITE)}`, async (numTxs) => {
        if (numTxs.toLowerCase() === 'skip') {
          await showMenu(wallets);
          return;
        }
        const parsedNumTxs = parseInt(numTxs);
        if (isNaN(parsedNumTxs) || parsedNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Please enter a positive integer.', COLORS.RED)}`);
          await handleStakeR2USD(wallets);
          return;
        }
        for (const wallet of walletList) {
          console.log(`\n${colorText(`Processing wallet: ${wallet.address} (${NETWORKS[wallet.networkKey].name})`, COLORS.WHITE)}`);
          for (let i = 1; i <= parsedNumTxs; i++) {
            console.log(`${EMOJI.LOADING} ${colorText(`Executing staking transaction ${i} of ${parsedNumTxs} (Amount: ${parsedAmount} R2USD)`, COLORS.YELLOW)}`);
            const success = await stakeR2USD(wallet, parsedAmount);
            if (success) {
              console.log(`${EMOJI.SUCCESS} ${colorText(`Staking transaction ${i} completed successfully!`, COLORS.GREEN)}`);
            } else {
              console.error(`${EMOJI.ERROR} ${colorText(`Staking transaction ${i} failed. Continuing to next transaction.`, COLORS.RED)}`);
            }
          }
          console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${parsedNumTxs} staking transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
        }
        await showMenu(wallets);
      });
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred during R2USD staking process:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function setupDailySwapAndStake(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];

    console.log(`\n${colorText('Setup Daily Swap and Stake', COLORS.WHITE)}`);
    console.log(`${colorText('Select tasks to schedule (enter "skip" to keep current settings):', COLORS.YELLOW)}`);

    console.log(`\n${colorText('1. USDC to R2USD Swap', COLORS.YELLOW)}`);
    rl.question(`${colorText('Enter amount of USDC to swap daily (or "skip"): ', COLORS.WHITE)}`, async (usdcAmount) => {
      if (usdcAmount.toLowerCase() !== 'skip') {
        const parsedUsdcAmount = parseFloat(usdcAmount);
        if (isNaN(parsedUsdcAmount) || parsedUsdcAmount <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Skipping USDC to R2USD setup.', COLORS.RED)}`);
          await proceedToR2usdToUsdcSetup(walletList);
          return;
        }
        rl.question(`${colorText('Enter number of daily swap transactions: ', COLORS.WHITE)}`, async (usdcNumTxs) => {
          const parsedUsdcNumTxs = parseInt(usdcNumTxs);
          if (isNaN(parsedUsdcNumTxs) || parsedUsdcNumTxs <= 0) {
            console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Skipping USDC to R2USD setup.', COLORS.RED)}`);
            await proceedToR2usdToUsdcSetup(walletList);
            return;
          }
          dailyTasks.usdcToR2usd = { enabled: true, amount: parsedUsdcAmount, numTxs: parsedUsdcNumTxs };
          console.log(`${EMOJI.SUCCESS} ${colorText(`Daily USDC to R2USD swap set: ${parsedUsdcAmount} USDC, ${parsedUsdcNumTxs} transactions`, COLORS.GREEN)}`);
          await proceedToR2usdToUsdcSetup(walletList);
        });
      } else {
        await proceedToR2usdToUsdcSetup(walletList);
      }
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Error during daily swap and stake setup:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function proceedToR2usdToUsdcSetup(walletList) {
  console.log(`\n${colorText('2. R2USD to USDC Swap', COLORS.YELLOW)}`);
  rl.question(`${colorText('Enter amount of R2USD to swap daily (or "skip"): ', COLORS.WHITE)}`, async (r2usdAmount) => {
    if (r2usdAmount.toLowerCase() !== 'skip') {
      const parsedR2usdAmount = parseFloat(r2usdAmount);
      if (isNaN(parsedR2usdAmount) || parsedR2usdAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Skipping R2USD to USDC setup.', COLORS.RED)}`);
        await proceedToStakeSetup(walletList);
        return;
      }
      rl.question(`${colorText('Enter number of daily swap transactions: ', COLORS.WHITE)}`, async (r2usdNumTxs) => {
        const parsedR2usdNumTxs = parseInt(r2usdNumTxs);
        if (isNaN(parsedR2usdNumTxs) || parsedR2usdNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Skipping R2USD to USDC setup.', COLORS.RED)}`);
          await proceedToStakeSetup(walletList);
          return;
        }
        dailyTasks.r2usdToUsdc = { enabled: true, amount: parsedR2usdAmount, numTxs: parsedR2usdNumTxs };
        console.log(`${EMOJI.SUCCESS} ${colorText(`Daily R2USD to USDC swap set: ${parsedR2usdAmount} R2USD, ${parsedR2usdNumTxs} transactions`, COLORS.GREEN)}`);
        await proceedToStakeSetup(walletList);
      });
    } else {
      await proceedToStakeSetup(walletList);
    }
  });
}

async function proceedToStakeSetup(walletList) {
  console.log(`\n${colorText('3. Stake R2USD', COLORS.YELLOW)}`);
  rl.question(`${colorText('Enter amount of R2USD to stake daily (or "skip"): ', COLORS.WHITE)}`, async (stakeAmount) => {
    if (stakeAmount.toLowerCase() !== 'skip') {
      const parsedStakeAmount = parseFloat(stakeAmount);
      if (isNaN(parsedStakeAmount) || parsedStakeAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Skipping Stake R2USD setup.', COLORS.RED)}`);
        await startDailyTasks(walletList);
        return;
      }
      rl.question(`${colorText('Enter number of daily staking transactions: ', COLORS.WHITE)}`, async (stakeNumTxs) => {
        const parsedStakeNumTxs = parseInt(stakeNumTxs);
        if (isNaN(parsedStakeNumTxs) || parsedStakeNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Skipping Stake R2USD setup.', COLORS.RED)}`);
          await startDailyTasks(walletList);
          return;
        }
        dailyTasks.stakeR2usd = { enabled: true, amount: parsedStakeAmount, numTxs: parsedStakeNumTxs };
        console.log(`${EMOJI.SUCCESS} ${colorText(`Daily Stake R2USD set: ${parsedStakeAmount} R2USD, ${parsedStakeNumTxs} transactions`, COLORS.GREEN)}`);
        await startDailyTasks(walletList);
      });
    } else {
      await startDailyTasks(walletList);
    }
  });
}

async function startDailyTasks(wallets) {
  console.log(`\n${EMOJI.SUCCESS} ${colorText('Daily tasks configured. Executing tasks immediately...', COLORS.GREEN)}`);
  
  await executeDailyTasks(wallets);

  console.log(`${EMOJI.INFO} ${colorText('Scheduling daily tasks every 24 hours...', COLORS.GREEN)}`);
  const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000; 
  startCountdown(wallets, DAILY_INTERVAL_MS);

  setInterval(() => {
    executeDailyTasks(wallets);
  }, DAILY_INTERVAL_MS);

  await showMenu(wallets);
}

module.exports = {
  selectNetwork,
  showMenu,
  selectWallet,
  displayBalances,
  handleUSDCtoR2USDSwap,
  handleR2USDtoUSDCSwap,
  handleStakeR2USD,
  setupDailySwapAndStake,
  proceedToR2usdToUsdcSetup,
  proceedToStakeSetup,
  startDailyTasks,
  rl
};
