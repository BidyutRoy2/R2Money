const { ethers } = require('ethers');
const { ERC20_ABI } = require('../config/constants');
const { EMOJI, colorText, COLORS } = require('../utils/colors');

async function checkBalance(wallet, tokenAddress) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);
    const decimals = await tokenContract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText(`Failed to check balance for token ${tokenAddress}:`, COLORS.RED)}`, error);
    return '0';
  }
}

async function checkEthBalance(wallet) {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to check ETH balance:', COLORS.RED)}`, error);
    return '0';
  }
}

async function approveToken(wallet, tokenAddress, spenderAddress, amount) {
  try {
    if (!ethers.utils.isAddress(spenderAddress)) {
      throw new Error(`Invalid spender address: ${spenderAddress}`);
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const decimals = await tokenContract.decimals();
    const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);
    if (currentAllowance.gte(ethers.utils.parseUnits(amount.toString(), decimals))) {
      console.log(`${EMOJI.INFO} ${colorText('Sufficient allowance already exists', COLORS.GRAY)}`);
      return true;
    }
    console.log(`${EMOJI.LOADING} ${colorText(`Approving ${amount} tokens for spending...`, COLORS.YELLOW)}`);
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const tx = await tokenContract.approve(spenderAddress, amountInWei, { gasLimit: 100000 });
    console.log(`${EMOJI.INFO} ${colorText(`Approval transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on explorer: ${NETWORKS[wallet.networkKey].explorer}/tx/${tx.hash}`, COLORS.GRAY)}`);
    await tx.wait();
    console.log(`${EMOJI.SUCCESS} ${colorText('Approval confirmed', COLORS.GREEN)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to approve token:', COLORS.RED)}`, error);
    return false;
  }
}

async function estimateGasFees(provider) {
  try {
    const feeData = await provider.getFeeData();
    return {
      maxFeePerGas: feeData.maxFeePerGas || ethers.utils.parseUnits('0.1', 'gwei'),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.utils.parseUnits('0.1', 'gwei')
    };
  } catch (error) {
    console.error(`${EMOJI.WARNING} ${colorText('Failed to estimate gas fees, using defaults:', COLORS.YELLOW)}`, error);
    return {
      maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
      maxPriorityFeePerGas: ethers.utils.parseUnits('0.1', 'gwei')
    };
  }
}

module.exports = { checkBalance, checkEthBalance, approveToken, estimateGasFees };
