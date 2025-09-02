import axios from "axios";
import Web3 from "web3";
import "dotenv/config";
import { CONFIG } from "./config.js";

// --- ENVIRONMENT & SETUP --- //
const { ROUTER_URL, ROUTER_API_KEY, ROUTER_INTEGRATOR_PID, ARBITRUM_RPC_URL, BASE_RPC_URL, OPTIMISM_RPC_URL } = process.env;
const rpcUrls = { arbitrum: ARBITRUM_RPC_URL, base: BASE_RPC_URL, optimism: OPTIMISM_RPC_URL };
const web3Instances = {
    arbitrum: new Web3(ARBITRUM_RPC_URL),
    base: new Web3(BASE_RPC_URL),
    optimism: new Web3(OPTIMISM_RPC_URL),
};

async function getQuoteFromRouter(chainName, fromToken, toToken, amount) {
  const payload = {
    chainID: chainName, inputToken: fromToken, outputToken: toToken,
    inputAmount: amount, computeEstimate: true, uniquePID: ROUTER_INTEGRATOR_PID,
    userAddress: "0x2EEF625EBf5f20eDf0D858E30d73b4321E6E5Eaa",
    outputReceiver: "0x2EEF625EBf5f20eDf0D858E30d73b4321E6E5Eaa",
  };
  const headers = { "x-api-key": ROUTER_API_KEY };
  try {
    const response = await axios.post(`${ROUTER_URL}/price`, payload, { headers });
    return response.data.result; 
  } catch (error) { return null; }
}

async function getGasCostInUSD(chainConfig, nativeTokenPriceUSD) {
    if (!nativeTokenPriceUSD || nativeTokenPriceUSD === 0) return Infinity;
    try {
        const web3 = web3Instances[chainConfig.name];
        const gasPriceWei = await web3.eth.getGasPrice();
        const gasCostNative = BigInt(gasPriceWei) * BigInt(chainConfig.estimatedGasLimit);
        
        const gasCostInEther = web3.utils.fromWei(gasCostNative.toString(), 'ether');
        const costUSD = parseFloat(gasCostInEther) * nativeTokenPriceUSD;
        
        return costUSD;
    } catch (error) {
        console.error(`Could not get gas cost for ${chainConfig.name}: ${error.message}`);
        return Infinity;
    }
}

async function getNativeTokenPrices() {
    const prices = {};
    for (const chain of CONFIG.chains) {
        if (chain.tokens.WETH && chain.tokens.USDC) {
            const quote = await getQuoteFromRouter(chain.name, chain.tokens.WETH, chain.tokens.USDC, (10n**18n).toString());
            prices[chain.name] = quote ? parseFloat(quote.effectiveOutputAmountUSD) : 0;
        } else {
            prices[chain.name] = 0; 
        }
    }
    return prices;
}


// --- MAIN ARBITRAGE LOGIC --- //

async function checkPairOnChains(chainA, chainB, pair, nativeTokenPrices) {
  const pairName = `${pair.from}/${pair.to}`;

  if (!chainA.tokens[pair.from] || !chainA.tokens[pair.to]) {
    console.log(`-> SKIPPING ${pairName} on ${chainA.name}: Token not configured.`);
    return;
  }
  if (!chainB.tokens[pair.from] || !chainB.tokens[pair.to]) {
     console.log(`-> SKIPPING ${pairName} on ${chainB.name}: Token not configured.`);
    return;
  }

  const [quoteResultA, quoteResultB] = await Promise.all([
    getQuoteFromRouter(chainA.name, chainA.tokens[pair.from], chainA.tokens[pair.to], pair.tradeAmount),
    getQuoteFromRouter(chainB.name, chainB.tokens[pair.from], chainB.tokens[pair.to], pair.tradeAmount),
  ]);

  if (!quoteResultA || !quoteResultB) return;

  const sellQuote = parseFloat(quoteResultA.effectiveOutputAmountUSD) > parseFloat(quoteResultB.effectiveOutputAmountUSD) ? quoteResultA : quoteResultB;
  const buyQuote = parseFloat(quoteResultA.effectiveOutputAmountUSD) > parseFloat(quoteResultB.effectiveOutputAmountUSD) ? quoteResultB : quoteResultA;

  const sellChain = parseFloat(quoteResultA.effectiveOutputAmountUSD) > parseFloat(quoteResultB.effectiveOutputAmountUSD) ? chainA : chainB;
  const buyChain = parseFloat(quoteResultA.effectiveOutputAmountUSD) > parseFloat(quoteResultB.effectiveOutputAmountUSD) ? chainB : chainA;
  
  const grossProfitUSD = parseFloat(sellQuote.effectiveOutputAmountUSD) - parseFloat(buyQuote.inputAmountUSD);

  const [gasCostSell, gasCostBuy] = await Promise.all([
    getGasCostInUSD(sellChain, nativeTokenPrices[sellChain.name]),
    getGasCostInUSD(buyChain, nativeTokenPrices[buyChain.name]),
  ]);
  const totalGasCostUSD = gasCostSell + gasCostBuy;
  
  const netProfitUSD = grossProfitUSD - totalGasCostUSD;

  console.log("")
  console.log(`-- ${pairName} | ${sellChain.name} (Sell) vs ${buyChain.name} (Buy) --`);
  console.log(`Gross Profit: $${grossProfitUSD.toFixed(4)} | Gas Costs: $${totalGasCostUSD.toFixed(4)} | Net Profit: $${netProfitUSD.toFixed(4)}`);
  console.log("")

  const initialInvestmentUSD = parseFloat(buyQuote.inputAmountUSD);
  if(initialInvestmentUSD === 0) return; 
  const percentageProfit = (netProfitUSD / initialInvestmentUSD) * 100;

  if (netProfitUSD > 0 && percentageProfit > CONFIG.PROFIT_THRESHOLD) {
    console.log(`🔥🔥🔥 PAPER TRADE OPPORTUNITY: ${pairName} | Net Profit: $${netProfitUSD.toFixed(4)} 🔥🔥🔥`);
    console.log(`ACTION: SELL ${pair.from} on ${sellChain.name}, BUY ${pair.from} on ${buyChain.name}`);
    console.log("")
  }
}

async function main() {
  console.log("Starting Highly-Accurate Gas-Aware Scanner...");
  setInterval(async () => {
    console.log(`\n--- Cycle Starting at ${new Date().toLocaleString()} ---`);
    
    const nativeTokenPrices = await getNativeTokenPrices();
    console.log("Current ETH Prices:", nativeTokenPrices);

    for (let i = 0; i < CONFIG.chains.length; i++) {
      for (let j = i + 1; j < CONFIG.chains.length; j++) {
        for (const pair of CONFIG.pairs) {
          await checkPairOnChains(CONFIG.chains[i], CONFIG.chains[j], pair, nativeTokenPrices);
        }
      }
    }
  }, 45000);
}

main().catch(console.error);

