import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PriceChart from '../components/PriceChart';
import { AuthContext, API_URL } from '../context/AuthContext';

const StockDetails = () => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Trade state
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('BUY');
  const [tradeMessage, setTradeMessage] = useState(null);
  const [tradeError, setTradeError] = useState(null);
  const [executingTrade, setExecutingTrade] = useState(false);
  const [ownedShares, setOwnedShares] = useState(0);

  const { user, updateBalance } = useContext(AuthContext);

  // Fetch stock details
  const fetchStockDetails = async (isSilent = false) => {
    try {
      const res = await axios.get(`${API_URL}/stocks/${symbol}`);
      if (res.data.success) {
        setStock(res.data.data);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching stock details:', err);
      if (!isSilent) setError(`Failed to load details for ${symbol}.`);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Fetch user holdings to check if they own shares of this stock
  const fetchOwnedShares = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/portfolio`);
      if (res.data.success) {
        const holding = res.data.data.holdings.find(h => h.symbol === symbol.toUpperCase());
        setOwnedShares(holding ? holding.quantity : 0);
      }
    } catch (err) {
      console.error('Error fetching owned shares:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStockDetails();
    fetchOwnedShares();
  }, [symbol]);

  // Set up polling for stock updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStockDetails(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [symbol]);

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setTradeError('Please sign in or register to execute trades.');
      return;
    }

    const tradeQty = parseInt(quantity, 10);
    if (isNaN(tradeQty) || tradeQty <= 0) {
      setTradeError('Please enter a valid positive quantity.');
      return;
    }

    setTradeError(null);
    setTradeMessage(null);
    setExecutingTrade(true);

    try {
      const res = await axios.post(`${API_URL}/transactions/trade`, {
        symbol: symbol.toUpperCase(),
        type: tradeType,
        quantity: tradeQty
      });

      if (res.data.success) {
        setTradeMessage(res.data.message);
        updateBalance(res.data.data.newBalance);
        
        // Refresh owned shares
        const updatedHolding = res.data.data.holdings.find(h => h.symbol === symbol.toUpperCase());
        setOwnedShares(updatedHolding ? updatedHolding.quantity : 0);
        
        setQuantity(1);
      }
    } catch (err) {
      console.error('Trade error:', err);
      setTradeError(err.response?.data?.message || 'Trade execution failed.');
    } finally {
      setExecutingTrade(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading Stock Details...</span>
        </div>
        <p className="text-muted mt-3">Analyzing stock charts & details...</p>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger border-0 glass-panel p-4 text-center">
          <h4 className="fw-bold mb-3">{error || 'Stock Not Found'}</h4>
          <Link to="/" className="btn btn-premium-cyan rounded-pill px-4">
            Back to Market
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const estimatedCost = (quantity * stock.price).toFixed(2);

  return (
    <div className="container mb-5">
      {/* Header and Details Title */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <Link to="/" className="text-gradient small text-decoration-none fw-semibold mb-2 d-inline-block">
            ← Back to Market
          </Link>
          <div className="d-flex align-items-center gap-3">
            <h1 className="fw-extrabold text-light mb-0">{stock.symbol}</h1>
            <span className="fs-5 text-muted">{stock.name}</span>
          </div>
        </div>
        <div className="text-end mt-2 mt-md-0">
          <h2 className="fw-extrabold text-light mb-0">${stock.price.toFixed(2)}</h2>
          <span className={`badge ${isPositive ? 'badge-up' : 'badge-down'} fs-6 mt-1`}>
            {isPositive ? '▲ +' : '▼ '}
            {stock.change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Chart and Key Stats */}
        <div className="col-lg-8">
          {/* Chart Panel */}
          <div className="card glass-panel p-4 mb-4">
            <h5 className="fw-bold text-light mb-3">Historical Performance</h5>
            <PriceChart history={stock.history} symbol={stock.symbol} />
          </div>

          {/* Stats Grid */}
          <div className="glass-panel p-4">
            <h5 className="fw-bold text-light mb-4">Key Statistics</h5>
            <div className="row g-3">
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-secondary bg-opacity-10 rounded-3 text-center border border-light-subtle border-opacity-10">
                  <small className="text-muted d-block mb-1">Open</small>
                  <span className="fw-bold text-light">${stock.open.toFixed(2)}</span>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-secondary bg-opacity-10 rounded-3 text-center border border-light-subtle border-opacity-10">
                  <small className="text-muted d-block mb-1">High</small>
                  <span className="fw-bold text-success">${stock.high.toFixed(2)}</span>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-secondary bg-opacity-10 rounded-3 text-center border border-light-subtle border-opacity-10">
                  <small className="text-muted d-block mb-1">Low</small>
                  <span className="fw-bold text-danger">${stock.low.toFixed(2)}</span>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-secondary bg-opacity-10 rounded-3 text-center border border-light-subtle border-opacity-10">
                  <small className="text-muted d-block mb-1">Volume</small>
                  <span className="fw-bold text-light">{stock.volume.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Trade Widget */}
        <div className="col-lg-4">
          <div className="card glass-panel p-4 h-100 justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-light mb-0">Simulated Trading</h5>
                {user && (
                  <span className="badge bg-secondary">
                    Owned: {ownedShares} Shares
                  </span>
                )}
              </div>
              
              {/* Messages */}
              {tradeError && (
                <div className="alert alert-danger border-0 small py-2 px-3 mb-3 rounded-3" role="alert">
                  {tradeError}
                </div>
              )}
              {tradeMessage && (
                <div className="alert alert-success border-0 small py-2 px-3 mb-3 rounded-3" role="alert">
                  {tradeMessage}
                </div>
              )}

              {/* Trade Type Selection */}
              <div className="row g-2 mb-4">
                <div className="col-6">
                  <button
                    type="button"
                    className={`btn w-100 py-2.5 rounded-3 fw-bold ${
                      tradeType === 'BUY' ? 'btn-success' : 'btn-glass text-muted'
                    }`}
                    onClick={() => setTradeType('BUY')}
                  >
                    Buy Stock
                  </button>
                </div>
                <div className="col-6">
                  <button
                    type="button"
                    className={`btn w-100 py-2.5 rounded-3 fw-bold ${
                      tradeType === 'SELL' ? 'btn-danger' : 'btn-glass text-muted'
                    }`}
                    onClick={() => setTradeType('SELL')}
                  >
                    Sell Stock
                  </button>
                </div>
              </div>

              <form onSubmit={handleTradeSubmit}>
                {/* Quantity Input */}
                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">Quantity</label>
                  <div className="input-group">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="form-control form-control-custom text-center py-2"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      min="1"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setQuantity(prev => prev + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Estimate */}
                <div className="glass-panel p-3 mb-4 border-light-subtle border-opacity-10 bg-opacity-25 bg-secondary">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Share Price</span>
                    <span className="text-light fw-semibold">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Shares</span>
                    <span className="text-light fw-semibold">× {quantity}</span>
                  </div>
                  <hr className="my-2 border-secondary" />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small fw-bold">Est. Total</span>
                    <span className={`fw-bold fs-5 ${tradeType === 'BUY' ? 'text-success' : 'text-danger'}`}>
                      ${estimatedCost}
                    </span>
                  </div>
                </div>

                {user ? (
                  <button
                    type="submit"
                    disabled={executingTrade}
                    className={`btn w-100 py-3 fw-bold rounded-3 ${
                      tradeType === 'BUY' ? 'btn-premium-cyan' : 'btn-premium-purple'
                    }`}
                  >
                    {executingTrade ? 'Executing Order...' : `Place ${tradeType} Order`}
                  </button>
                ) : (
                  <div className="text-center">
                    <Link to="/login" className="btn btn-premium-cyan w-100 py-3 fw-bold rounded-3 mb-2">
                      Sign In to Trade
                    </Link>
                    <small className="text-muted">Virtual portfolio and $10k cash requires sign-in.</small>
                  </div>
                )}
              </form>
            </div>
            
            {user && (
              <div className="mt-4 pt-3 border-top border-secondary text-center text-muted small">
                Cash Available: <span className="text-light fw-bold">${user.balance.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetails;
