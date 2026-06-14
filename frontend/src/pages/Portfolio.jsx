import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL } from '../context/AuthContext';

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useContext(AuthContext);

  const fetchPortfolioAndTransactions = async () => {
    if (!user) return;
    try {
      const [portRes, txRes] = await Promise.all([
        axios.get(`${API_URL}/portfolio`),
        axios.get(`${API_URL}/transactions/my`)
      ]);

      if (portRes.data.success) {
        setPortfolioData(portRes.data.data);
      }
      if (txRes.data.success) {
        setTransactions(txRes.data.data);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to fetch portfolio data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPortfolioAndTransactions();
  }, [user]);

  // Set up polling for stock price changes affecting portfolio valuation
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchPortfolioAndTransactions();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <div className="card glass-panel p-5 d-inline-block max-width-md">
          <h3 className="fw-bold text-light mb-3">Portfolio Tracker</h3>
          <p className="text-muted mb-4">Please sign in or create an account to view and manage your stock holdings.</p>
          <Link to="/login" className="btn btn-premium-cyan rounded-pill px-4 me-2">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-glass rounded-pill px-4">
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading Portfolio...</span>
        </div>
        <p className="text-muted mt-3">Computing investment returns & holdings...</p>
      </div>
    );
  }

  const summary = portfolioData?.summary || {
    cashBalance: user.balance,
    totalInvested: 0,
    currentHoldingsValue: 0,
    netProfitOrLoss: 0,
    netProfitOrLossPercent: 0,
    totalPortfolioValue: user.balance
  };

  const holdings = portfolioData?.holdings || [];
  const isProfit = summary.netProfitOrLoss >= 0;

  return (
    <div className="container mb-5">
      {/* Portfolio Overview Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-extrabold text-light mb-0">Investment Portfolio</h2>
          <p className="text-muted small mb-0">Monitor your holdings and asset allocations</p>
        </div>
        <button className="btn btn-glass btn-sm d-flex align-items-center gap-2" onClick={fetchPortfolioAndTransactions}>
          Refresh Rates
        </button>
      </div>

      {error && (
        <div className="alert alert-danger border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Summary Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card glass-panel p-4 h-100 border-light-subtle border-opacity-10 bg-opacity-25 bg-secondary">
            <small className="text-muted d-block mb-1">Total Net Worth</small>
            <h3 className="fw-extrabold text-light mb-0">
              ${summary.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card glass-panel p-4 h-100 border-light-subtle border-opacity-10 bg-opacity-25 bg-secondary">
            <small className="text-muted d-block mb-1">Cash Balance (Virtual)</small>
            <h3 className="fw-extrabold text-gradient mb-0">
              ${summary.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card glass-panel p-4 h-100 border-light-subtle border-opacity-10 bg-opacity-25 bg-secondary">
            <small className="text-muted d-block mb-1">Holdings Value</small>
            <h3 className="fw-extrabold text-light mb-0">
              ${summary.currentHoldingsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card glass-panel p-4 h-100 border-light-subtle border-opacity-10 bg-opacity-25 bg-secondary">
            <small className="text-muted d-block mb-1">Total Return (P&L)</small>
            <h3 className={`fw-extrabold mb-0 ${isProfit ? 'text-success' : 'text-danger'}`}>
              {isProfit ? '+' : ''}
              {summary.netProfitOrLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="fs-6 fw-bold ms-1">({isProfit ? '+' : ''}{summary.netProfitOrLossPercent}%)</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="card glass-panel p-4 mb-4">
        <h4 className="fw-bold text-light mb-4">Active Holdings</h4>
        
        {holdings.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-3">You don't own any stocks yet.</p>
            <Link to="/" className="btn btn-premium-cyan rounded-pill px-4">
              Explore Market to Trade
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th className="text-end">Shares</th>
                  <th className="text-end">Avg. Price</th>
                  <th className="text-end">Total Cost</th>
                  <th className="text-end">Live Price</th>
                  <th className="text-end">Current Value</th>
                  <th className="text-end">Total Return</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => {
                  const isHoldingProfit = holding.profitOrLoss >= 0;
                  return (
                    <tr key={holding._id}>
                      <td className="fw-bold">{holding.symbol}</td>
                      <td className="text-end fw-semibold text-light">{holding.quantity}</td>
                      <td className="text-end">${holding.averagePrice.toFixed(2)}</td>
                      <td className="text-end">${holding.totalCost.toFixed(2)}</td>
                      <td className="text-end fw-semibold text-light">${holding.currentPrice.toFixed(2)}</td>
                      <td className="text-end fw-bold">${holding.currentValue.toFixed(2)}</td>
                      <td className={`text-end fw-bold ${isHoldingProfit ? 'text-success' : 'text-danger'}`}>
                        {isHoldingProfit ? '+' : ''}
                        ${holding.profitOrLoss.toFixed(2)}
                        <span className="small d-block font-weight-normal text-muted" style={{ fontSize: '0.75rem' }}>
                          {isHoldingProfit ? '+' : ''}
                          {holding.profitOrLossPercent}%
                        </span>
                      </td>
                      <td className="text-center">
                        <Link to={`/stock/${holding.symbol}`} className="btn btn-glass btn-sm rounded-pill py-1 px-3">
                          Trade
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="card glass-panel p-4">
        <h4 className="fw-bold text-light mb-4">Transaction History</h4>
        
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No transaction records found. Your trades will be logged here.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Symbol</th>
                  <th>Order Type</th>
                  <th className="text-end">Shares</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Total Sum</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  return (
                    <tr key={tx._id}>
                      <td className="text-muted small">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="fw-bold">{tx.symbol}</td>
                      <td>
                        <span className={`badge ${isBuy ? 'badge-up' : 'badge-down'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="text-end fw-semibold text-light">{tx.quantity}</td>
                      <td className="text-end">${tx.price.toFixed(2)}</td>
                      <td className="text-end fw-semibold text-light">${tx.totalPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
