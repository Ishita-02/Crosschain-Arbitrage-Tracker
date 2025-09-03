import Web3 from "web3";
import "dotenv/config";


const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set in the .env file");
}

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function buildApprovalTx(web3, tokenAddress, owner, spender, amount) {
  const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);

  const nonce = await web3.eth.getTransactionCount(owner, "latest");
  const gasPrice = await web3.eth.getGasPrice();
  const chainId = await web3.eth.getChainId();

  const transaction = {
    from: owner,
    to: tokenAddress,
    nonce: nonce,
    gasPrice: gasPrice,
    gas: 100000, 
    chainId: chainId,
    data: tokenContract.methods.approve(spender, amount).encodeABI(),
  };

  return transaction;
}

async function signAndSendTransaction(web3, transactionData) {
  try {
    const signedTx = await web3.eth.accounts.signTransaction(
      transactionData,
      PRIVATE_KEY
    );

    console.log(`Sending transaction...`);

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    const txHash = receipt.transactionHash;
    console.log(`Transaction sent successfully: ${txHash}`);
    return txHash;
  } catch (error) {
    console.error(`Error signing or sending transaction:`, error);
    return null;
  }
}

export default {buildApprovalTx, signAndSendTransaction};