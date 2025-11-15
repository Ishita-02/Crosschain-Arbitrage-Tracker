CREATE DATABASE arbitrage_intelligence;

CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    pair_name VARCHAR(50) NOT NULL,
    buy_chain VARCHAR(50) NOT NULL,
    sell_chain VARCHAR(50) NOT NULL,
    initial_investment_usd DECIMAL(18, 4),
    net_profit_usd DECIMAL(18, 4) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_opportunities_timestamp ON opportunities(timestamp);