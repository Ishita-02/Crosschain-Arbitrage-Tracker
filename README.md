# Arbitrage Intelligence Platform
The Arbitrage Intelligence Platform is a full-stack application designed to automatically detect and display cryptocurrency arbitrage opportunities across different blockchain networks. It features a backend scanner that continuously monitors prices and a user-friendly frontend dashboard to visualize the findings.

## Features
**Cross-Chain Scanning:** The platform actively scans for price differences on multiple blockchain networks like Arbitrum, Base, and Optimism.

**Live Dashboard:** A clean and intuitive user interface built with React and Tailwind CSS that displays data in real-time.

**Persistent Storage:** All identified opportunities are logged in a PostgreSQL database for tracking and analysis.

**Performance Metrics:** The dashboard includes leaderboards for the most profitable trading pairs and routes, providing valuable insights at a glance.

**Real-Time Price Feeds:** Utilizes Web3.js to fetch real-time gas prices and integrates with the GlueX Protocol API for asset pricing.

<img width="1470" height="799" alt="Screenshot 2025-09-15 at 4 16 33 PM" src="https://github.com/user-attachments/assets/9d7c2af6-42ca-4427-b885-ca5ed9598dab" />

<img width="1470" height="800" alt="Screenshot 2025-09-15 at 6 38 44 PM" src="https://github.com/user-attachments/assets/b1772f45-f6c5-46f1-a8de-808bde86c85c" />

## Architecture
The application is composed of two main parts:

**Backend:** A Node.js application responsible for the following:

1. A scanner script (main.js) that runs at set intervals to check for arbitrage opportunities across configured chains and token pairs.
2. An Express.js API (api.js) that serves the collected data to the frontend.

**Frontend:** A React application that provides a dashboard for visualizing the arbitrage data fetched from the backend API.
