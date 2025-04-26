const NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
    symbol: 'ETH',
    contracts: {
      USDC_ADDRESS: '0xef84994ef411c4981328ffce5fda41cd3803fae4',
      R2USD_ADDRESS: '0x20c54c5f742f123abb49a982bfe0af47edb38756',
      SR2USD_ADDRESS: '0xbd6b25c4132f09369c354bee0f7be777d7d434fa',
      USDC_TO_R2USD_CONTRACT: '0x20c54c5f742f123abb49a982bfe0af47edb38756',
      R2USD_TO_USDC_CONTRACT: '0x07abd582df3d3472aa687a0489729f9f0424b1e3',
      STAKE_R2USD_CONTRACT: '0xbd6b25c4132f09369c354bee0f7be777d7d434fa',
      USDC_TO_R2USD_METHOD_ID: '0x095e7a95',
      R2USD_TO_USDC_METHOD_ID: '0x3df02124',
      STAKE_R2USD_METHOD_ID: '0x1a5f0f00'
    }
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://arbitrum-sepolia.drpc.org',
    explorer: 'https://sepolia.arbiscan.io',
    symbol: 'ETH',
    contracts: {
      USDC_ADDRESS: '0xef84994eF411c4981328fFcE5Fda41cD3803faE4',
      R2USD_ADDRESS: '0x20c54C5F742F123Abb49a982BFe0af47edb38756',
      SR2USD_ADDRESS: '0x6b9573B7dB7fB98Ff4014ca8E71F57aB7B7ffDFB',
      USDC_TO_R2USD_CONTRACT: '0xCcE6bfcA2558c15bB5faEa7479A706735Aef9634',
      R2USD_TO_USDC_CONTRACT: '0xCcE6bfcA2558c15bB5faEa7479A706735Aef9634',
      STAKE_R2USD_CONTRACT: '0x6b9573B7dB7fB98Ff4014ca8E71F57aB7B7ffDFB',
      USDC_TO_R2USD_METHOD_ID: '0x3df02124',
      R2USD_TO_USDC_METHOD_ID: '0x3df02124',
      STAKE_R2USD_METHOD_ID: '0x1a5f0f00'
    }
  }
};

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)'
];

const SWAP_ABI = [
  'function exchange(int128 i, int128 j, uint256 _dx, uint256 _min_dy) external'
];

module.exports = { NETWORKS, ERC20_ABI, SWAP_ABI };
