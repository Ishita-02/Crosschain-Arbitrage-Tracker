import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = "https://crosschain-arbitrage-tracker.onrender.com"; 

const LiveIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <circle cx="12" cy="12" r="5" fill="#4ade80" className="animate-pulse" />
    <circle cx="12" cy="12" r="9" stroke="#4ade80" strokeWidth="2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-2 text-slate-500">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);


const LeaderboardCard = ({ title, data, renderItem }) => (
  <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg backdrop-blur-sm">
    <h2 className="text-xl font-semibold text-slate-200 mb-4">{title}</h2>
    <div className="space-y-3">
      {data.length > 0 ? data.map((item, index) => renderItem(item, index)) : (
        <p className="text-slate-500 text-sm">No data available yet. Waiting for scanner...</p>
      )}
    </div>
  </div>
);

const OpportunitiesTable = ({ opportunities }) => (
  <div className="bg-slate-800/50 rounded-lg shadow-lg backdrop-blur-sm mt-8">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-200">Latest Opportunities</h2>
      <p className="text-sm text-slate-500 mt-1">Showing the most recent profitable trades found by the scanner.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-slate-700">
          <tr>
            <th className="p-4 text-sm font-medium text-slate-400">Pair</th>
            <th className="p-4 text-sm font-medium text-slate-400">Route</th>
            <th className="p-4 text-sm font-medium text-slate-400 text-right">Net Profit (USD)</th>
            <th className="p-4 text-sm font-medium text-slate-400 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.length > 0 ? opportunities.map((op, index) => (
            <tr key={op.id || index} className="border-b border-slate-800 hover:bg-slate-700/50 transition-colors duration-200">
              <td className="p-4 text-slate-200 font-mono">{op.pair_name}</td>
              <td className="p-4 text-slate-300 flex items-center capitalize">
                {op.buy_chain}
                <ArrowRightIcon />
                {op.sell_chain}
              </td>
              <td className="p-4 text-green-400 font-mono text-right">${parseFloat(op.net_profit_usd).toFixed(4)}</td>
              <td className="p-4 text-slate-500 font-mono text-right text-xs">{new Date(op.timestamp).toLocaleString()}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="p-8 text-center text-slate-500">Scanning for the first opportunities...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);


function App() {
  const [latestOpportunities, setLatestOpportunities] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);
  const [topPairs, setTopPairs] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      const [oppsResponse, routesResponse, pairsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/opportunities/latest`),
        axios.get(`${API_BASE_URL}/api/leaderboard/routes`),
        axios.get(`${API_BASE_URL}/api/leaderboard/pairs`),
      ]);
      setLatestOpportunities(oppsResponse.data);
      setTopRoutes(routesResponse.data);
      setTopPairs(pairsResponse.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch data from API:", error);
    }
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, 15000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-slate-900 min-h-screen text-slate-300 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Arbitrage Intelligence Platform</h1>
          <div className="flex items-center mt-2 text-green-400">
            <LiveIcon />
            <span>Live | Last Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <LeaderboardCard
            title="Top Profitable Routes"
            data={topRoutes}
            renderItem={(item, index) => (
              <div key={index} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-md">
                <div className="flex items-center capitalize">
                  <span className="font-semibold text-slate-300">{index + 1}. {item.buy_chain}</span>
                  <ArrowRightIcon />
                  <span className="font-semibold text-slate-300">{item.sell_chain}</span>
                </div>
                <div className="text-right">
                    <span className="font-mono text-green-400">${parseFloat(item.total_profit).toFixed(2)}</span>
                    <p className="text-xs text-slate-500">{item.trade_count} trades</p>
                </div>
              </div>
            )}
          />
          <LeaderboardCard
            title="Top Profitable Pairs"
            data={topPairs}
            renderItem={(item, index) => (
               <div key={index} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-md">
                <div>
                  <span className="font-semibold text-slate-300">{index + 1}. {item.pair_name}</span>
                </div>
                <div className="text-right">
                    <span className="font-mono text-green-400">${parseFloat(item.total_profit).toFixed(2)}</span>
                    <p className="text-xs text-slate-500">{item.trade_count} trades</p>
                </div>
              </div>
            )}
          />
        </div>
        <OpportunitiesTable opportunities={latestOpportunities} />

      </div>
    </div>
  );
}

export default App;
