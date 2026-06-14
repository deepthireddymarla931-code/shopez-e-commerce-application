const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');

// @desc    Get all stocks with optional search
// @route   GET /api/stocks
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { symbol: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      };
    }

    // Sort by symbol alphabetically
    const stocks = await Stock.find(query).select('-history');
    res.json({ success: true, count: stocks.length, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol });

    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock with symbol ${symbol} not found` });
    }

    res.json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
