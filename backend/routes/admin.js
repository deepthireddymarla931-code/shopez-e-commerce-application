const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const { protect, adminOnly } = require('../middleware/auth');

// Apply protect & adminOnly to all routes in this file
router.use(protect);
router.use(adminOnly);

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all transactions across platform
// @route   GET /api/admin/transactions
// @access  Private/Admin
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new stock listing
// @route   POST /api/admin/stocks
// @access  Private/Admin
router.post('/stocks', async (req, res) => {
  const { symbol, name, price, open, volume } = req.body;

  if (!symbol || !name || !price) {
    return res.status(400).json({ success: false, message: 'Please provide symbol, name, and current price' });
  }

  const stockSymbol = symbol.toUpperCase().trim();
  const stockPrice = parseFloat(price);

  try {
    const stockExists = await Stock.findOne({ symbol: stockSymbol });
    if (stockExists) {
      return res.status(400).json({ success: false, message: `Stock with symbol ${stockSymbol} already exists` });
    }

    const openPrice = open ? parseFloat(open) : stockPrice;
    const history = [{ price: stockPrice, timestamp: new Date() }];

    const newStock = await Stock.create({
      symbol: stockSymbol,
      name,
      price: stockPrice,
      open: openPrice,
      high: stockPrice,
      low: stockPrice,
      volume: volume ? parseInt(volume, 10) : 100000,
      change: openPrice > 0 ? parseFloat((((stockPrice - openPrice) / openPrice) * 100).toFixed(2)) : 0.0,
      history,
    });

    res.status(201).json({ success: true, message: `Successfully listed ${stockSymbol}`, data: newStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update stock listing
// @route   PUT /api/admin/stocks/:symbol
// @access  Private/Admin
router.put('/stocks/:symbol', async (req, res) => {
  const stockSymbol = req.params.symbol.toUpperCase();
  const { name, price, volume } = req.body;

  try {
    const stock = await Stock.findOne({ symbol: stockSymbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock with symbol ${stockSymbol} not found` });
    }

    if (name) stock.name = name;
    if (volume) stock.volume = parseInt(volume, 10);
    
    if (price) {
      const newPrice = parseFloat(price);
      stock.price = newPrice;
      
      // Update high/low
      if (newPrice > stock.high) stock.high = newPrice;
      if (stock.low === 0 || newPrice < stock.low) stock.low = newPrice;

      // Recalculate change percentage
      if (stock.open > 0) {
        stock.change = parseFloat((((newPrice - stock.open) / stock.open) * 100).toFixed(2));
      }

      // Add to historical data
      stock.history.push({ price: newPrice, timestamp: new Date() });
      // Keep history limited to 100 entries to optimize db footprint
      if (stock.history.length > 100) {
        stock.history.shift();
      }
    }

    await stock.save();
    res.json({ success: true, message: `Updated stock ${stockSymbol}`, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete stock listing
// @route   DELETE /api/admin/stocks/:symbol
// @access  Private/Admin
router.delete('/stocks/:symbol', async (req, res) => {
  const stockSymbol = req.params.symbol.toUpperCase();

  try {
    const stock = await Stock.findOneAndDelete({ symbol: stockSymbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock with symbol ${stockSymbol} not found` });
    }

    res.json({ success: true, message: `Successfully deleted stock ${stockSymbol}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
