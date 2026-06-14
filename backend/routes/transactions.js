const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');
const { protect } = require('../middleware/auth');

// @desc    Execute a BUY or SELL trade
// @route   POST /api/transactions/trade
// @access  Private
router.post('/trade', protect, async (req, res) => {
  const { symbol, type, quantity } = req.body;

  // Form validations
  if (!symbol || !type || !quantity) {
    return res.status(400).json({ success: false, message: 'Please provide symbol, type, and quantity' });
  }

  const tradeType = type.toUpperCase();
  if (tradeType !== 'BUY' && tradeType !== 'SELL') {
    return res.status(400).json({ success: false, message: 'Invalid trade type. Must be BUY or SELL' });
  }

  const tradeQty = parseInt(quantity, 10);
  if (isNaN(tradeQty) || tradeQty <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
  }

  try {
    // Check if stock exists
    const stockSymbol = symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol: stockSymbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock with symbol ${stockSymbol} not found` });
    }

    const currentPrice = stock.price;
    const totalPrice = parseFloat((currentPrice * tradeQty).toFixed(2));

    // Get User and Portfolio
    const user = await User.findById(req.user.id);
    let portfolio = await Portfolio.findOne({ user: user._id });

    if (!portfolio) {
      portfolio = await Portfolio.create({ user: user._id, holdings: [] });
    }

    if (tradeType === 'BUY') {
      // Check if user has sufficient funds
      if (user.balance < totalPrice) {
        return res.status(400).json({
          success: false,
          message: `Insufficient funds. Purchase cost is $${totalPrice.toFixed(2)}, but you only have $${user.balance.toFixed(2)}`
        });
      }

      // Deduct balance
      user.balance = parseFloat((user.balance - totalPrice).toFixed(2));

      // Update holdings
      const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === stockSymbol);
      if (holdingIndex > -1) {
        const holding = portfolio.holdings[holdingIndex];
        holding.quantity += tradeQty;
        holding.totalCost = parseFloat((holding.totalCost + totalPrice).toFixed(2));
        holding.averagePrice = parseFloat((holding.totalCost / holding.quantity).toFixed(2));
      } else {
        portfolio.holdings.push({
          symbol: stockSymbol,
          quantity: tradeQty,
          averagePrice: currentPrice,
          totalCost: totalPrice
        });
      }

    } else if (tradeType === 'SELL') {
      // Check if user owns the stock
      const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === stockSymbol);
      if (holdingIndex === -1 || portfolio.holdings[holdingIndex].quantity < tradeQty) {
        const ownedQty = holdingIndex === -1 ? 0 : portfolio.holdings[holdingIndex].quantity;
        return res.status(400).json({
          success: false,
          message: `Insufficient holdings. You requested to sell ${tradeQty} shares of ${stockSymbol}, but you only own ${ownedQty} shares`
        });
      }

      const holding = portfolio.holdings[holdingIndex];
      
      // Add proceeds to user balance
      user.balance = parseFloat((user.balance + totalPrice).toFixed(2));

      // Update holdings
      holding.quantity -= tradeQty;
      holding.totalCost = parseFloat((holding.quantity * holding.averagePrice).toFixed(2));

      // If holdings quantity drops to 0, remove the holding
      if (holding.quantity === 0) {
        portfolio.holdings.splice(holdingIndex, 1);
      }
    }

    // Save transaction
    const transaction = await Transaction.create({
      user: user._id,
      symbol: stockSymbol,
      type: tradeType,
      quantity: tradeQty,
      price: currentPrice,
      totalPrice: totalPrice
    });

    // Save updated User and Portfolio
    await user.save();
    await portfolio.save();

    res.status(200).json({
      success: true,
      message: `Successfully completed ${tradeType} order of ${tradeQty} shares of ${stockSymbol}`,
      data: {
        transaction,
        newBalance: user.balance,
        holdings: portfolio.holdings
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user's transactions
// @route   GET /api/transactions/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 transactions

    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
