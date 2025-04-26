const { ethers } = require('ethers');
const { NETWORKS, ERC20_ABI } = require('../config/constants');
const { checkBalance, approveToken, estimateGasFees } = require('./blockchain');
const { EMOJI, colorText, COLORS } = require('../utils/colors');

async function stakeR2USD(wallet, amount) {
  try {
    const { contracts } = NETWORKS[wallet.networkKey];
    if (!ethers.utils.isAddress(contracts.STAKE_R2USD_CONTRACT)) {
      throw new Error(`Invalid staking contract address: ${contracts.STAKE_R2USD_CONTRACT}`);
    }

    const r2usdBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    if (parseFloat(r2usdBalance) < parseFloat(amount)) {
      console.error(`${EMOJI.ERROR} ${colorText(`Insufficient R2USD balance. You have ${r2usdBalance} R2USD but trying to stake ${amount} R2USD.`, COLORS.RED)}`);
      return false;
    }
    const r2usdContract = new ethers.Contract(contracts.R2USD_ADDRESS, ERC20_ABI, wallet);
    const decimals = await r2usdContract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const currentAllowance = await r2usdContract.allowance(wallet.address, contracts.STAKE_R2USD_CONTRACT);
    console.log(`${EMOJI.INFO} ${colorText(`Current R2USD allowance for staking contract: ${ethers.utils.formatUnits(currentAllowance, decimals)}`, COLORS.GRAY)}`);
    if (currentAllowance.lt(amountInWei)) {
      console.log(`${EMOJI.LOADING} ${colorText(`Approving ${amount} R2USD for staking contract...`, COLORS.YELLOW)}`);
      const approveTx = await r2usdContract.approve(contracts.STAKE_R2USD_CONTRACT, amountInWei, { gasLimit: 100000 });
      console.log(`${EMOJI.INFO} ${colorText(`Approval transaction sent: ${approveTx.hash}`, COLORS.WHITE)}`);
      console.log(`${EMOJI.INFO} ${colorText(`Check on explorer: ${NETWORKS[wallet.networkKey].explorer}/tx/${approveTx.hash}`, COLORS.GRAY)}`);
      await approveTx.wait();
      console.log(`${EMOJI.SUCCESS} ${colorText('Approval confirmed', COLORS.GREEN)}`);
    } else {
      console.log(`${EMOJI.INFO} ${colorText('Sufficient allowance already exists', COLORS.GRAY)}`);
    }
    const data = contracts.STAKE_R2USD_METHOD_ID +
                 amountInWei.toHexString().slice(2).padStart(64, '0') +
                 '0'.repeat(576);
    console.log(`${EMOJI.INFO} ${colorText(`Constructed data: ${data}`, COLORS.GRAY)}`);
    console.log(`${EMOJI.STAKE} ${colorText(`Staking ${amount} R2USD to sR2USD...`, COLORS.YELLOW)}`);
    const gasFees = await estimateGasFees(wallet.provider);
    const tx = await wallet.sendTransaction({
      to: contracts.STAKE_R2USD_CONTRACT,
      data: data,
      gasLimit: wallet.networkKey === 'arbitrumSepolia' ? 125788 : 100000,
      ...gasFees
    });
    console.log(`${EMOJI.INFO} ${colorText(`Transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on explorer: ${NETWORKS[wallet.networkKey].explorer}/tx/${tx.hash}`, COLORS.GRAY)}`);
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error('Transaction failed. The contract reverted the execution.');
    }
    console.log(`${EMOJI.SUCCESS} ${colorText('Staking confirmed!', COLORS.GREEN)}`);
    const newR2USDBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
    const newSR2USDBalance = await checkBalance(wallet, contracts.SR2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`New R2USD balance: ${newR2USDBalance}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.MONEY} ${colorText(`New sR2USD balance: ${newSR2USDBalance}`, COLORS.WHITE)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to stake R2USD:', COLORS.RED)}`, error);
    if (error.transaction) {
      console.error(`${EMOJI.ERROR} ${colorText('Transaction details:', COLORS.RED)}`, {
        hash: error.transaction.hash,
        to: error.transaction.to,
        from: error.transaction.from,
        data: error.transaction.data
      });
    }
    return false;
  }
}

module.exports = { stakeR2USD };
