import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockCard from '../components/StockCard';
import { API_URL } from '../context/AuthContext';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Fetch stocks
  const fetchStocks = async (isSilent = false) => {
    try {
      const res = await axios.get(`${API_URL}/stocks${search ? `?search=${search}` : ''}`);
      if (res.data.success) {
        setStocks(res.data.data);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      if (!isSilent) setError('Failed to retrieve stock list. Please try again.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Fetch initial stocks and set up search trigger
  useEffect(() => {
    fetchStocks();
  }, [search]);

  // Set up polling interval every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStocks(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [search]);

  // Derived lists for gainers / losers (based on all stocks)
  const sortedByChange = [...stocks].sort((a, b) => b.change - a.change);
  const gainers = sortedByChange.filter((s) => s.change > 0).slice(0, 4);
  const losers = [...sortedByChange].reverse().filter((s) => s.change < 0).slice(0, 4);

  return (
    <div className="container mb-5">
      {/* Jumbotron/Header */}
      <div className="glass-panel p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <h1 className="display-5 fw-extrabold text-light mb-2">
              Explore the Market with <span className="text-gradient">ShopEZ</span>
            </h1>
            <p className="lead text-muted mb-4">
              Monitor real-time fluctuations, view market insights, and simulate trades with a virtual balance.
            </p>
            <div className="d-flex max-width-md">
              <input
                type="text"
                className="form-control form-control-custom me-2"
                placeholder="Search stocks by symbol or name (e.g. AAPL)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearch('')}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="col-lg-4 d-none d-lg-block text-end">
            <div className="text-gradient-purple fw-bold display-1 opacity-25">MKT</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading Market...</span>
          </div>
          <p className="text-muted mt-3">Fetching live stock listings...</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Main Stock List Grid */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold text-light mb-0">Stock Catalog</h4>
              <small className="text-muted">Auto-refreshes every 10s</small>
            </div>
            
            {stocks.length === 0 ? (
              <div className="glass-panel text-center p-5 text-muted">
                No stocks match your search query. Try searching for "AAPL", "MSFT" or "TSLA".
              </div>
            ) : (
              <div className="row g-3">
                {stocks.map((stock) => (
                  <div key={stock._id} className="col-md-6 col-lg-4 col-sm-6">
                    <StockCard stock={stock} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar (Gainers & Losers) */}
          <div className="d-flex flex-column gap-4">
            {/* Gainers */}
            <div className="glass-panel p-4">
              <h5 className="fw-bold text-light mb-3 d-flex align-items-center">
                <span className="me-2 text-success">▲</span> Top Gainers
              </h5>
              {gainers.length === 0 ? (
                <small className="text-muted">No positive changes recorded.</small>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {gainers.map((stock) => (
                    <div key={stock._id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold text-light small d-block">{stock.symbol}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{stock.name}</span>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold text-light small d-block">${stock.price.toFixed(2)}</span>
                        <span className="badge badge-up" style={{ fontSize: '0.7rem' }}>+{stock.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Losers */}
            <div className="glass-panel p-4">
              <h5 className="fw-bold text-light mb-3 d-flex align-items-center">
                <span className="me-2 text-danger">▼</span> Top Losers
              </h5>
              {losers.length === 0 ? (
                <small className="text-muted">No negative changes recorded.</small>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {losers.map((stock) => (
                    <div key={stock._id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold text-light small d-block">{stock.symbol}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{stock.name}</span>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold text-light small d-block">${stock.price.toFixed(2)}</span>
                        <span className="badge badge-down" style={{ fontSize: '0.7rem' }}>{stock.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
