import os
from dotenv import load_dotenv
from erc20_abi import ERC20_ABI
from logger import get_logger

load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")

# Get module-specific logger
logger = get_logger("tx_utils")

def estimate_gas_cost(web3, token_price, token):

    gas_price = web3.eth.gas_price
    estimate_gas = 200_000
    eth_cost = gas_price * estimate_gas 

    token = web3.eth.contract(address=web3.to_checksum_address(token), abi=ERC20_ABI)
    #  decimals = token.functions.decimals().call()
    token_cost = eth_cost * token_price

    return float(token_cost) 


def build_approval_tx(w3, token_contract, owner, spender, amount):
    nonce = w3.eth.get_transaction_count(owner)

    approve_tx = token_contract.functions.approve(
        spender,
        amount
    ).build_transaction({
        "from": owner,
        "nonce": nonce,
        "gas": 100_000,
        "gasPrice": w3.eth.gas_price,
        "chainId": w3.eth.chain_id
    })

    return approve_tx


def sign_and_send_transaction(web3, transaction_data, trade_id):

    try:
        signed_tx = web3.eth.account.sign_transaction(transaction_data, private_key=PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        logger.info(f"{trade_id} - Transaction sent: {tx_hash.hex()}")
        return tx_hash.hex()
    except Exception as e:
        logger.error(f"{trade_id} -Error signing or sending transaction: {e}")
        return None