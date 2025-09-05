export const CONFIG = {
  PROFIT_THRESHOLD: 0.1, 

  chains: [
    {
      name: "arbitrum",
      nativeToken: "WETH",
      estimatedGasLimit: 700000,
      tokens: {
        WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      },
    },
    {
      name: "base",
      nativeToken: "WETH",
      estimatedGasLimit: 500000,
      tokens: {
        WETH: "0x4200000000000000000000000000000000000006",
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913",
        DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      },
    },
    {
      name: "optimism",
      nativeToken: "WETH",
      estimatedGasLimit: 500000,
      tokens: {
        WETH: "0x4200000000000000000000000000000000000006",
        USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
        DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
      },
    },
  ],

  pairs: [
    { from: "WETH", fromDecimals: 18, to: "USDC", toDecimals: 6, tradeAmount: "1000000000000000000" },
    { from: "WBTC", fromDecimals: 8, to: "USDC", toDecimals: 6, tradeAmount: "10000000" },    
    { from: "USDT", fromDecimals: 6, to: "USDC", toDecimals: 6, tradeAmount: "1000000000" }, 
    { from: "DAI", fromDecimals: 18, to: "USDC", toDecimals: 6, tradeAmount: "1000000000000000000000" }, 
  ],
};

