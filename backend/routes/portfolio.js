const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const { protect } = require('../middleware/auth');

// @desc    Get user's portfolio summary and holdings valuation
// @route   GET /api/portfolio
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let portfolio = await Portfolio.findOne({ user: user._id });

    if (!portfolio) {
      portfolio = await Portfolio.create({ user: user._id, holdings: [] });
    }

    // Get current stock prices to compute active valuation
    const stockSymbols = portfolio.holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: stockSymbols } });

    // Create a price map for quick lookup
    const priceMap = {};
    stocks.forEach(s => {
      priceMap[s.symbol] = {
        price: s.price,
        change: s.change
      };
    });

    let totalInvested = 0;
    let currentHoldingsValue = 0;

    const detailedHoldings = portfolio.holdings.map(holding => {
      const liveData = priceMap[holding.symbol] || { price: holding.averagePrice, change: 0 };
      const currentPrice = liveData.price;
      const currentValue = parseFloat((holding.quantity * currentPrice).toFixed(2));
      const totalCost = holding.totalCost;
      const profitOrLoss = parseFloat((currentValue - totalCost).toFixed(2));
      const profitOrLossPercent = totalCost > 0 
        ? parseFloat(((profitOrLoss / totalCost) * 100).toFixed(2)) 
        : 0.0;

      totalInvested += totalCost;
      currentHoldingsValue += currentValue;

      return {
        _id: holding._id,
        symbol: holding.symbol,
        quantity: holding.quantity,
        averagePrice: holding.averagePrice,
        totalCost,
        currentPrice,
        currentValue,
        profitOrLoss,
        profitOrLossPercent,
        change: liveData.change
      };
    });

    const netProfitOrLoss = parseFloat((currentHoldingsValue - totalInvested).toFixed(2));
    const netProfitOrLossPercent = totalInvested > 0 
      ? parseFloat(((netProfitOrLoss / totalInvested) * 100).toFixed(2)) 
      : 0.0;

    const totalPortfolioValue = parseFloat((currentHoldingsValue + user.balance).toFixed(2));

    res.json({
      success: true,
      data: {
        holdings: detailedHoldings,
        summary: {
          cashBalance: user.balance,
          totalInvested: parseFloat(totalInvested.toFixed(2)),
          currentHoldingsValue: parseFloat(currentHoldingsValue.toFixed(2)),
          netProfitOrLoss,
          netProfitOrLossPercent,
          totalPortfolioValue
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
