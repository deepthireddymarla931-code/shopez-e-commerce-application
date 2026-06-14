const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const StockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, 'Please add a stock symbol'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a company name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a current price'],
    },
    change: {
      type: Number,
      default: 0.0, // Percentage change
    },
    high: {
      type: Number,
      default: 0.0,
    },
    low: {
      type: Number,
      default: 0.0,
    },
    open: {
      type: Number,
      default: 0.0,
    },
    volume: {
      type: Number,
      default: 0,
    },
    history: [HistorySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Stock', StockSchema);
