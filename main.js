import axios from "axios";
import Web3 from "web3";
import "dotenv/config";
import pg from "pg";
import { CONFIG } from "./config.js";

const { Pool } = pg;
const pool = new Pool({
  // This line is key! It reads the DATABASE_URL from Render's environment.
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Render requires SSL connections, and this setting prevents errors.
    rejectUnauthorized: false
  }
});
console.log("Attempting to connect to PostgreSQL...");
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL database.");
  }
});

async function setupDatabase() {
  const setupQuery = `
    CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        pair_name VARCHAR(50) NOT NULL,
        buy_chain VARCHAR(50) NOT NULL,
        sell_chain VARCHAR(50) NOT NULL,
        net_profit_usd DECIMAL(18, 4) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_opportunities_timestamp ON opportunities(timestamp);
  `;
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database.");
    console.log("Checking and setting up database schema...");
    await client.query(setupQuery);
    console.log("Database schema is ready.");
    client.release();
  } catch (err) {
    console.error("Database connection or setup error:", err.stack);
    // Exit the process if we can't connect to or set up the DB
    process.exit(1); 
  }
}


const { ROUTER_URL, ROUTER_API_KEY, ROUTER_INTEGRATOR_PID, ARBITRUM_RPC_URL, BASE_RPC_URL, OPTIMISM_RPC_URL } = process.env;
const rpcUrls = { arbitrum: ARBITRUM_RPC_URL, base: BASE_RPC_URL, optimism: OPTIMISM_RPC_URL };
const web3Instances = {
    arbitrum: new Web3(ARBITRUM_RPC_URL),
    base: new Web3(BASE_RPC_URL),
    optimism: new Web3(OPTIMISM_RPC_URL),
};

async function getPriceFromRouter(chainName, fromToken, toToken, amount) {
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
        return Infinity;
    }
}

async function getNativeTokenPrices() {
    const prices = {};
    for (const chain of CONFIG.chains) {
        if (chain.tokens.WETH && chain.tokens.USDC) {
            const quote = await getPriceFromRouter(chain.name, chain.tokens.WETH, chain.tokens.USDC, (10n**18n).toString());
            prices[chain.name] = quote ? parseFloat(quote.effectiveOutputAmountUSD) : 0;
        } else {
            prices[chain.name] = 0; 
        }
    }
    return prices;
}

async function saveOpportunity(opportunity) {
    const { pairName, buyChain, sellChain, netProfitUSD } = opportunity;
    const queryText = `
        INSERT INTO opportunities (pair_name, buy_chain, sell_chain, net_profit_usd)
        VALUES ($1, $2, $3, $4)
    `;
    try {
        await pool.query(queryText, [pairName, buyChain, sellChain, netProfitUSD]);
        console.log(`Saved opportunity to database: ${pairName} | $${netProfitUSD.toFixed(4)}`);
    } catch (error) {
        console.error("Error saving opportunity to database:", error);
    }
}


async function checkPairOnChains(chainA, chainB, pair, nativeTokenPrices) {
  const pairName = `${pair.from}/${pair.to}`;

  if (!chainA.tokens[pair.from] || !chainA.tokens[pair.to]) return null;
  if (!chainB.tokens[pair.from] || !chainB.tokens[pair.to]) return null;

  const [quoteResultA, quoteResultB] = await Promise.all([
    getPriceFromRouter(chainA.name, chainA.tokens[pair.from], chainA.tokens[pair.to], pair.tradeAmount),
    getPriceFromRouter(chainB.name, chainB.tokens[pair.from], chainB.tokens[pair.to], pair.tradeAmount),
  ]);

  if (!quoteResultA || !quoteResultB) return null;

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

  console.log(`-- ${pairName} | ${sellChain.name} (Sell) vs ${buyChain.name} (Buy) | Net Profit: $${netProfitUSD.toFixed(4)}`);

  const initialInvestmentUSD = parseFloat(buyQuote.inputAmountUSD);
  if(initialInvestmentUSD === 0) return null; 
  const percentageProfit = (netProfitUSD / initialInvestmentUSD) * 100;

  if (netProfitUSD > 0 && percentageProfit > CONFIG.PROFIT_THRESHOLD) {
    return {
      pairName,
      buyChain: buyChain.name,
      sellChain: sellChain.name,
      netProfitUSD,
    };
  }
  return null;
}

async function main() {
  await setupDatabase();
  
  console.log("Starting Scanner with Database Logging...");
  setInterval(async () => {
    console.log(`\n--- New Scan Cycle at ${new Date().toLocaleString()} ---`);
    const nativeTokenPrices = await getNativeTokenPrices();
    console.log("Current ETH Prices:", nativeTokenPrices);

    const profitableOpportunities = [];

    for (let i = 0; i < CONFIG.chains.length; i++) {
      for (let j = i + 1; j < CONFIG.chains.length; j++) {
        for (const pair of CONFIG.pairs) {
          const result = await checkPairOnChains(CONFIG.chains[i], CONFIG.chains[j], pair, nativeTokenPrices);
          if (result) {
            profitableOpportunities.push(result);
            await saveOpportunity(result); 
          }
        }
      }
    }

    console.log("\n--- Top 3 Profitable Opportunities This Cycle ---");
    if (profitableOpportunities.length === 0) {
      console.log("No profitable opportunities found that meet the threshold.");
    } else {
      profitableOpportunities.sort((a, b) => b.netProfitUSD - a.netProfitUSD);
      profitableOpportunities.slice(0, 3).forEach((opp, index) => {
        console.log(`#${index + 1}: ${opp.pairName} | Route: ${opp.buyChain} -> ${opp.sellChain} | PROFIT: $${opp.netProfitUSD.toFixed(4)}`);
      });
    }

  }, 60000);
}

main().catch(console.error);

