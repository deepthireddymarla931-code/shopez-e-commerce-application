import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (result && !result.success) {
      setError(result.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card glass-panel p-4 p-md-5">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-light mb-1">Welcome Back</h2>
              <p className="text-muted small">Sign in to manage your stock portfolio</p>
            </div>

            {error && (
              <div className="alert alert-danger border-0 small py-2 px-3 mb-4 rounded-3" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control form-control-custom py-2.5"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label text-muted small fw-semibold mb-0">Password</label>
                </div>
                <input
                  type="password"
                  className="form-control form-control-custom py-2.5"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-premium-cyan w-100 py-2.5 fw-bold rounded-3 mb-3"
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-3">
              <span className="text-muted small">Don't have an account? </span>
              <Link to="/register" className="text-gradient fw-semibold small text-decoration-none">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
