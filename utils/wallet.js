const { ethers } = require('ethers');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { getRandomProxy, formatProxy } = require('./proxy');
const { EMOJI, colorText, COLORS } = require('./colors');
const { NETWORKS } = require('../config/constants');

async function initializeWallet(privateKey, networkKey) {
  try {
    const networkConfig = NETWORKS[networkKey];
    if (!networkConfig) {
      throw new Error(`Invalid network: ${networkKey}`);
    }
    const { rpcUrl, name, chainId } = networkConfig;
    console.log(`${EMOJI.INFO} ${colorText(`Connecting to ${name} via: ${rpcUrl}`, COLORS.WHITE)}`);
    
    let provider;
    const proxyString = getRandomProxy();
    
    if (proxyString) {
      const proxyConfig = formatProxy(proxyString);
      console.log(`${EMOJI.INFO} ${colorText(`Using proxy: ${proxyString}`, COLORS.GRAY)}`);
      
      const agent = new HttpsProxyAgent({
        host: proxyConfig.host,
        port: proxyConfig.port,
        auth: proxyConfig.auth ? `${proxyConfig.auth.username}:${proxyConfig.auth.password}` : undefined
      });
      
      provider = new ethers.providers.JsonRpcProvider(
        {
          url: rpcUrl,
          agent
        },
        {
          name,
          chainId
        }
      );
    } else {
      provider = new ethers.providers.JsonRpcProvider(rpcUrl, {
        name,
        chainId
      });
    }
    
    const network = await provider.getNetwork();
    console.log(`${EMOJI.SUCCESS} ${colorText(`Connected to network: ${network.name} (chainId: ${network.chainId})`, COLORS.GREEN)}`);
    
    const wallet = new ethers.Wallet(privateKey, provider);
    wallet.networkKey = networkKey;
    console.log(`${EMOJI.WALLET} ${colorText(`Connected with wallet: ${wallet.address}`, COLORS.WHITE)}`);
    return { provider, wallet };
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText(`Failed to initialize wallet for private key ${privateKey.slice(0, 6)}... on ${networkKey}`, COLORS.RED)}`, error);
    throw error;
  }
}

module.exports = { initializeWallet };
