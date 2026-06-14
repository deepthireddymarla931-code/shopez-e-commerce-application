const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { seedStocks } = require('./utils/seeder');
const Stock = require('./models/Stock');

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const transactionRoutes = require('./routes/transactions');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Setup Port
const PORT = process.env.PORT || 5000;

// Connect to Database & Start Server
const startServer = async () => {
  await connectDB();
  
  // Seed stocks database if empty
  await seedStocks();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start real-time price simulation
    startPriceSimulation();
  });
};

// Real-Time Price Simulation Engine
// Simulates minor market price fluctuations every 15 seconds
const startPriceSimulation = () => {
  console.log('Stock price simulator active (running in background)...');

  setInterval(async () => {
    try {
      const stocks = await Stock.find({});
      if (stocks.length === 0) return;

      for (const stock of stocks) {
        // Random change factor between -1.5% and +1.5%
        const pctChange = (Math.random() * 0.03) - 0.015;
        const oldPrice = stock.price;
        const newPrice = parseFloat((oldPrice * (1 + pctChange)).toFixed(2));

        stock.price = newPrice;
        
        // Update high/low
        if (newPrice > stock.high) stock.high = newPrice;
        if (stock.low === 0 || newPrice < stock.low) stock.low = newPrice;

        // Calculate change based on open price
        if (stock.open > 0) {
          stock.change = parseFloat((((newPrice - stock.open) / stock.open) * 100).toFixed(2));
        }

        // Add to historical price records for plotting
        stock.history.push({ price: newPrice, timestamp: new Date() });

        // Limit chart history to 50 items to optimize database performance
        if (stock.history.length > 50) {
          stock.history.shift();
        }

        await stock.save();
      }
      
      // console.log(`Simulated stock updates executed at: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error during stock price simulation:', error.message);
    }
  }, 15000); // Executed every 15 seconds
};

startServer();
