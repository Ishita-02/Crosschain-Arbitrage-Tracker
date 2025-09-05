import express from "express";
import pg from "pg";
import cors from "cors";
import "dotenv/config";

const PORT = process.env.PORT ;
const app = express();

const { Pool } = pg;
const pool = new Pool();

app.use(cors()); 
app.use(express.json()); 

app.get("/api/opportunities/latest", async (req, res) => {
  try {
    const query = `
      SELECT * FROM opportunities
      ORDER BY timestamp DESC
      LIMIT 50;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching latest opportunities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/leaderboard/routes", async (req, res) => {
  try {
    const query = `
      SELECT buy_chain, sell_chain, SUM(net_profit_usd) as total_profit, COUNT(*) as trade_count
      FROM opportunities
      GROUP BY buy_chain, sell_chain
      ORDER BY total_profit DESC
      LIMIT 10;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching route leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/leaderboard/pairs", async (req, res) => {
    try {
      const query = `
        SELECT pair_name, SUM(net_profit_usd) as total_profit, COUNT(*) as trade_count
        FROM opportunities
        GROUP BY pair_name
        ORDER BY total_profit DESC
        LIMIT 10;
      `;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching pair leaderboard:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


app.listen(PORT, () => {
  console.log(`🚀 API server is running on http://localhost:${PORT}`);
});

    
