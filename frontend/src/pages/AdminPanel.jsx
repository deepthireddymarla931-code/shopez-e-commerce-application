import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL } from '../context/AuthContext';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  // Lists state
  const [usersList, setUsersList] = useState([]);
  const [txList, setTxList] = useState([]);
  const [stocksList, setStocksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for creating stock
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOpen, setNewOpen] = useState('');
  const [newVolume, setNewVolume] = useState('500000');
  const [formMsg, setFormMsg] = useState(null);
  const [formErr, setFormErr] = useState(null);

  // Form states for updating stock price
  const [selectedStockSymbol, setSelectedStockSymbol] = useState('');
  const [updatedPrice, setUpdatedPrice] = useState('');
  const [updateMsg, setUpdateMsg] = useState(null);
  const [updateErr, setUpdateErr] = useState(null);

  const fetchAdminData = async () => {
    try {
      const [usersRes, txRes, stocksRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`),
        axios.get(`${API_URL}/admin/transactions`),
        axios.get(`${API_URL}/stocks`)
      ]);

      if (usersRes.data.success) setUsersList(usersRes.data.data);
      if (txRes.data.success) setTxList(txRes.data.data);
      if (stocksRes.data.success) setStocksList(stocksRes.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to fetch administration data reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      setLoading(true);
      fetchAdminData();
    }
  }, [user]);

  const handleCreateStock = async (e) => {
    e.preventDefault();
    if (!newSymbol || !newName || !newPrice) {
      setFormErr('Symbol, name, and current price are required');
      return;
    }

    setFormErr(null);
    setFormMsg(null);

    try {
      const res = await axios.post(`${API_URL}/admin/stocks`, {
        symbol: newSymbol,
        name: newName,
        price: parseFloat(newPrice),
        open: newOpen ? parseFloat(newOpen) : parseFloat(newPrice),
        volume: newVolume ? parseInt(newVolume, 10) : 500000
      });

      if (res.data.success) {
        setFormMsg(`Successfully created stock ${newSymbol.toUpperCase()}`);
        setNewSymbol('');
        setNewName('');
        setNewPrice('');
        setNewOpen('');
        setNewVolume('500000');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Create stock error:', err);
      setFormErr(err.response?.data?.message || 'Failed to list stock.');
    }
  };

  const handleUpdateStockPrice = async (e) => {
    e.preventDefault();
    if (!selectedStockSymbol || !updatedPrice) {
      setUpdateErr('Select a stock and enter a new price');
      return;
    }

    setUpdateErr(null);
    setUpdateMsg(null);

    try {
      const res = await axios.put(`${API_URL}/admin/stocks/${selectedStockSymbol}`, {
        price: parseFloat(updatedPrice)
      });

      if (res.data.success) {
        setUpdateMsg(`Successfully updated price for ${selectedStockSymbol} to $${updatedPrice}`);
        setUpdatedPrice('');
        setSelectedStockSymbol('');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Update stock price error:', err);
      setUpdateErr(err.response?.data?.message || 'Failed to update stock price.');
    }
  };

  const handleDeleteStock = async (symbol) => {
    if (!window.confirm(`Are you sure you want to delete the stock listing ${symbol}? This action is permanent.`)) {
      return;
    }

    try {
      const res = await axios.delete(`${API_URL}/admin/stocks/${symbol}`);
      if (res.data.success) {
        alert(`Successfully deleted ${symbol}`);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Delete stock error:', err);
      alert(err.response?.data?.message || 'Failed to delete stock listing.');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null; // Let the redirect trigger
  }

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading Admin Console...</span>
        </div>
        <p className="text-muted mt-3">Compiling user records & trade logs...</p>
      </div>
    );
  }

  return (
    <div className="container mb-5">
      <div className="mb-4">
        <h2 className="fw-extrabold text-light mb-1">Admin Dashboard</h2>
        <p className="text-muted small">Manage catalog listings, evaluate transaction logs, and oversee user balances</p>
      </div>

      {error && (
        <div className="alert alert-danger border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Stock Management Row */}
      <div className="row g-4 mb-4">
        {/* Create Stock Card */}
        <div className="col-md-6">
          <div className="card glass-panel p-4 h-100">
            <h5 className="fw-bold text-light mb-3">Add New Stock Listing</h5>
            
            {formErr && <div className="alert alert-danger border-0 small py-2 px-3 mb-3">{formErr}</div>}
            {formMsg && <div className="alert alert-success border-0 small py-2 px-3 mb-3">{formMsg}</div>}
            
            <form onSubmit={handleCreateStock}>
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <label className="form-label text-muted small fw-semibold">Symbol</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="e.g. MSFT"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    required
                  />
                </div>
                <div className="col-8">
                  <label className="form-label text-muted small fw-semibold">Company Name</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Microsoft Corporation"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row g-2 mb-4">
                <div className="col-4">
                  <label className="form-label text-muted small fw-semibold">Current Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-custom"
                    placeholder="120.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label text-muted small fw-semibold">Open Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-custom"
                    placeholder="Leave blank for same"
                    value={newOpen}
                    onChange={(e) => setNewOpen(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label text-muted small fw-semibold">Volume</label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    placeholder="500000"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-premium-cyan w-100 py-2.5 fw-bold rounded-3">
                List Stock Asset
              </button>
            </form>
          </div>
        </div>

        {/* Update Price Card */}
        <div className="col-md-6">
          <div className="card glass-panel p-4 h-100">
            <h5 className="fw-bold text-light mb-3">Adjust Stock Pricing</h5>
            
            {updateErr && <div className="alert alert-danger border-0 small py-2 px-3 mb-3">{updateErr}</div>}
            {updateMsg && <div className="alert alert-success border-0 small py-2 px-3 mb-3">{updateMsg}</div>}

            <form onSubmit={handleUpdateStockPrice}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Select Stock</label>
                <select
                  className="form-select form-select-custom py-2"
                  value={selectedStockSymbol}
                  onChange={(e) => setSelectedStockSymbol(e.target.value)}
                  required
                >
                  <option value="">-- Choose Stock --</option>
                  {stocksList.map(s => (
                    <option key={s._id} value={s.symbol}>
                      {s.symbol} - {s.name} (${s.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-semibold">New Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-custom py-2"
                  placeholder="e.g. 185.50"
                  value={updatedPrice}
                  onChange={(e) => setUpdatedPrice(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-premium-purple w-100 py-2.5 fw-bold rounded-3">
                Confirm Price Shift
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Stock Listings Management Catalog */}
      <div className="card glass-panel p-4 mb-4">
        <h5 className="fw-bold text-light mb-3">Current Catalog Listings</h5>
        <div className="table-responsive" style={{ maxHeight: '250px' }}>
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th className="text-end">Current Price</th>
                <th className="text-end">Daily Change</th>
                <th className="text-end">Open</th>
                <th className="text-end">High</th>
                <th className="text-end">Low</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {stocksList.map(s => (
                <tr key={s._id}>
                  <td className="fw-bold">{s.symbol}</td>
                  <td>{s.name}</td>
                  <td className="text-end fw-semibold text-light">${s.price.toFixed(2)}</td>
                  <td className={`text-end fw-semibold ${s.change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </td>
                  <td className="text-end">${s.open.toFixed(2)}</td>
                  <td className="text-end text-success">${s.high.toFixed(2)}</td>
                  <td className="text-end text-danger">${s.low.toFixed(2)}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1"
                      onClick={() => handleDeleteStock(s.symbol)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users and Transactions Row */}
      <div className="row g-4">
        {/* User Account Registry */}
        <div className="col-lg-6">
          <div className="card glass-panel p-4 h-100">
            <h5 className="fw-bold text-light mb-3">User Registry Audit</h5>
            <div className="table-responsive" style={{ maxHeight: '350px' }}>
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="text-end">Virtual Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u._id}>
                      <td className="fw-semibold text-light">{u.username}</td>
                      <td className="text-muted small">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-gradient">${u.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Transactions Log */}
        <div className="col-lg-6">
          <div className="card glass-panel p-4 h-100">
            <h5 className="fw-bold text-light mb-3">Global Platform Transactions Log</h5>
            <div className="table-responsive" style={{ maxHeight: '350px' }}>
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Trader</th>
                    <th>Asset</th>
                    <th>Action</th>
                    <th className="text-end">Shares</th>
                    <th className="text-end">Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {txList.map(tx => (
                    <tr key={tx._id}>
                      <td>
                        <div className="fw-semibold text-light">{tx.user?.username || 'Deleted User'}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="fw-bold">{tx.symbol}</td>
                      <td>
                        <span className={`badge ${tx.type === 'BUY' ? 'badge-up' : 'badge-down'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="text-end fw-semibold text-light">{tx.quantity}</td>
                      <td className="text-end text-light">${tx.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
