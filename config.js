export const CONFIG = {
  // Profitability threshold in percent. An opportunity is only flagged if the
  // price difference is greater than this value AFTER accounting for gas fees.
  PROFIT_THRESHOLD: 0.1,

  chains: [
    {
      name: "arbitrum",
      nativeToken: "WETH", // Native token for gas payment
      estimatedGasLimit: 700000, // Estimated gas units for a swap
      tokens: {
        WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      },
    },
    {
      name: "base",
      nativeToken: "WETH",
      estimatedGasLimit: 500000,
      tokens: {
        WETH: "0x4200000000000000000000000000000000000006",
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913",
        WBTC: "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
      },
    },
    {
      name: "optimism",
      nativeToken: "WETH",
      estimatedGasLimit: 500000,
      tokens: {
        WETH: "0x4200000000000000000000000000000000000006",
        USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
        ARB: "0x4200000000000000000000000000000000000042",
      },
    },
  ],
  
  // Define the pairs we want to scan. Decimals are no longer needed here.
  pairs: [
    { from: "WETH", to: "USDC", tradeAmount: "1000000000000000000" }, // 1 WETH
    { from: "WBTC", to: "USDC", tradeAmount: "10000000" }, // 0.1 WBTC
    { from: "ARB", to: "WETH", tradeAmount: "100000000000000000000" }, // 100 ARB
  ],
};

