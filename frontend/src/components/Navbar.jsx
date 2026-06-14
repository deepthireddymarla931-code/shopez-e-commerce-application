import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3 mb-4 sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <span className="fs-3 fw-bold text-gradient me-2">ShopEZ</span>
          <span className="badge bg-secondary text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
            Stock Trader
          </span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Market
              </Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/portfolio">
                    Portfolio
                  </Link>
                </li>
                {user.role === 'ADMIN' && (
                  <li className="nav-item">
                    <Link className="nav-link text-gradient-purple fw-semibold" to="/admin">
                      Admin Panel
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center">
            {user ? (
              <div className="d-flex align-items-center gap-3">
                <div className="d-none d-md-block text-end">
                  <div className="fw-semibold text-light">{user.username}</div>
                  <div className="text-gradient fw-bold" style={{ fontSize: '0.9rem' }}>
                    Cash: ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="d-block d-md-none text-light fw-bold me-2">
                  ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {user.role === 'ADMIN' && (
                  <span className="badge bg-danger text-uppercase" style={{ fontSize: '0.65rem' }}>
                    Admin
                  </span>
                )}
                <button onClick={handleLogout} className="btn btn-outline-light btn-sm px-3 rounded-pill">
                  Logout
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-glass btn-sm rounded-pill px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-premium-cyan btn-sm rounded-pill px-3">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
