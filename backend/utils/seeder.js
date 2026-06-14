const Stock = require('../models/Stock');

const initialStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 180.00 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 400.00 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 150.00 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 175.00 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 220.00 },
  { symbol: 'NVDA', name: 'Nvidia Corporation', price: 800.00 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 450.00 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 600.00 }
];

const seedStocks = async () => {
  try {
    const stockCount = await Stock.countDocuments();
    if (stockCount > 0) {
      console.log('Database already has stock data. Skipping seeding.');
      return;
    }

    console.log('Seeding initial stock data...');
    
    const seededList = [];
    for (const item of initialStocks) {
      const history = [];
      const basePrice = item.price;
      const count = 20; // Generate 20 historical data points

      // Pre-fill history in the past (e.g. 5-minute increments)
      for (let i = count; i >= 0; i--) {
        const timeOffset = i * 5 * 60 * 1000; // 5 mins in ms
        // Simulate a minor fluctuation
        const randomPercent = (Math.sin(i) * 0.02) + (Math.cos(i * 1.5) * 0.01);
        const histPrice = parseFloat((basePrice * (1 + randomPercent)).toFixed(2));
        history.push({
          price: histPrice,
          timestamp: new Date(Date.now() - timeOffset)
        });
      }

      const high = Math.max(...history.map(h => h.price), basePrice);
      const low = Math.min(...history.map(h => h.price), basePrice);
      const open = history[0].price;

      seededList.push({
        ...item,
        change: parseFloat((((basePrice - open) / open) * 100).toFixed(2)),
        high,
        low,
        open,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        history
      });
    }

    await Stock.insertMany(seededList);
    console.log(`Successfully seeded ${seededList.length} stocks.`);
  } catch (error) {
    console.error(`Error seeding stocks: ${error.message}`);
  }
};

module.exports = { seedStocks };
