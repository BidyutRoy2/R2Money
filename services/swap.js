const { ethers } = require('ethers');
const { NETWORKS, ERC20_ABI, SWAP_ABI } = require('../config/constants');
const { checkBalance, approveToken, estimateGasFees } = require('./blockchain');
const { EMOJI, colorText, COLORS } = require('../utils/colors');

async function swapUSDCtoR2USD(wallet, amount) {
  try {
    const { contracts } = NETWORKS[wallet.networkKey];
    const usdcBalance = await checkBalance(wallet, contracts.USDC_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`Current USDC balance: ${usdcBalance}`, COLORS.WHITE)}`);
    if (parseFloat(usdcBalance) < parseFloat(amount)) {
      console.error(`${EMOJI.ERROR} ${colorText(`Insufficient USDC balance. You have ${usdcBalance} USDC but trying to swap ${amount} USDC.`, COLORS.RED)}`);
      return false;
    }
    const approved = await approveToken(wallet, contracts.USDC_ADDRESS, contracts.USDC_TO_R2USD_CONTRACT, amount);
    if (!approved) return false;
    const usdcContract = new ethers.Contract(contracts.USDC_ADDRESS, ERC20_ABI, wallet);
    const decimals = await usdcContract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const minOutput = amountInWei.mul(99).div(100);
    let data;
    if (wallet.networkKey === 'sepolia') {
      data = ethers.utils.hexConcat([
        contracts.USDC_TO_R2USD_METHOD_ID,
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
          [wallet.address, amountInWei, 0, 0, 0, 0, 0]
        )
      ]);
    } else {
      const swapContract = new ethers.Contract(contracts.USDC_TO_R2USD_CONTRACT, SWAP_ABI, wallet);
      data = swapContract.interface.encodeFunctionData('exchange', [1, 0, amountInWei, minOutput]);
    }
    console.log(`${EMOJI.SWAP} ${colorText(`Swapping ${amount} USDC to R2USD...`, COLORS.YELLOW)}`);
    const gasFees = await estimateGasFees(wallet.provider);
    const tx = await wallet.sendTransaction({
      to: contracts.USDC_TO_R2USD_CONTRACT,
      data: data,
      gasLimit: wallet.networkKey === 'arbitrumSepolia' ? 163140 : 500000,
      ...gasFees
    });
    console.log(`${EMOJI.INFO} ${colorText(`Transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on explorer: ${NETWORKS[wallet.networkKey].explorer}/tx/${tx.hash}`, COLORS.GRAY)}`);
    await tx.wait();
    console.log(`${EMOJI.SUCCESS} ${colorText('Swap confirmed!', COLORS.GREEN)}`);
    const newUSDCBalance = await checkBalance(wallet, contracts.USDC_ADDRESS);
    const newR2USDBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`New USDC balance: ${newUSDCBalance}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.MONEY} ${colorText(`New R2USD balance: ${newR2USDBalance}`, COLORS.WHITE)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to swap USDC to R2USD:', COLORS.RED)}`, error);
    return false;
  }
}

async function swapR2USDtoUSDC(wallet, amount) {
  try {
    const { contracts } = NETWORKS[wallet.networkKey];
    const r2usdBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    if (parseFloat(r2usdBalance) < parseFloat(amount)) {
      console.error(`${EMOJI.ERROR} ${colorText(`Insufficient R2USD balance. You have ${r2usdBalance} R2USD but trying to swap ${amount} R2USD.`, COLORS.RED)}`);
      return false;
    }
    const approved = await approveToken(wallet, contracts.R2USD_ADDRESS, contracts.R2USD_TO_USDC_CONTRACT, amount);
    if (!approved) return false;
    const r2usdContract = new ethers.Contract(contracts.R2USD_ADDRESS, ERC20_ABI, wallet);
    const decimals = await r2usdContract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const minOutput = amountInWei.mul(97).div(100);
    let data;
    if (wallet.networkKey === 'sepolia') {
      data = contracts.R2USD_TO_USDC_METHOD_ID +
             '0000000000000000000000000000000000000000000000000000000000000000' +
             '0000000000000000000000000000000000000000000000000000000000000001' +
             amountInWei.toHexString().slice(2).padStart(64, '0') +
             minOutput.toHexString().slice(2).padStart(64, '0');
    } else {
      const swapContract = new ethers.Contract(contracts.R2USD_TO_USDC_CONTRACT, SWAP_ABI, wallet);
      data = swapContract.interface.encodeFunctionData('exchange', [0, 1, amountInWei, minOutput]);
    }
    console.log(`${EMOJI.SWAP} ${colorText(`Swapping ${amount} R2USD to USDC...`, COLORS.YELLOW)}`);
    const gasFees = await estimateGasFees(wallet.provider);
    const tx = await wallet.sendTransaction({
      to: contracts.R2USD_TO_USDC_CONTRACT,
      data: data,
      gasLimit: wallet.networkKey === 'arbitrumSepolia' ? 163140 : 500000,
      ...gasFees
    });
    console.log(`${EMOJI.INFO} ${colorText(`Transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on explorer: ${NETWORKS[wallet.networkKey].explorer}/tx/${tx.hash}`, COLORS.GRAY)}`);
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error('Transaction failed. The contract reverted the execution.');
    }
    console.log(`${EMOJI.SUCCESS} ${colorText('Swap confirmed!', COLORS.GREEN)}`);
    const newUSDCBalance = await checkBalance(wallet, contracts.USDC_ADDRESS);
    const newR2USDBalance = await checkBalance(wallet, contracts.R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`New USDC balance: ${newUSDCBalance}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.MONEY} ${colorText(`New R2USD balance: ${newR2USDBalance}`, COLORS.WHITE)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to swap R2USD to USDC:', COLORS.RED)}`, error);
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

module.exports = { swapUSDCtoR2USD, swapR2USDtoUSDC };
