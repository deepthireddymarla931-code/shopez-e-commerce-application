import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await register(username, email, password, role);
    setSubmitting(false);

    if (result && !result.success) {
      setError(result.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card glass-panel p-4 p-md-5">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-light mb-1">Create Account</h2>
              <p className="text-muted small">Register to start trading virtual stocks</p>
            </div>

            {error && (
              <div className="alert alert-danger border-0 small py-2 px-3 mb-4 rounded-3" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Username</label>
                <input
                  type="text"
                  className="form-control form-control-custom py-2"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control form-control-custom py-2"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Account Role</label>
                <select
                  className="form-select form-select-custom py-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="USER">Investor (USER)</option>
                  <option value="ADMIN">Administrator (ADMIN)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Password</label>
                <input
                  type="password"
                  className="form-control form-control-custom py-2"
                  placeholder="•••••••• (Min. 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-semibold">Confirm Password</label>
                <input
                  type="password"
                  className="form-control form-control-custom py-2"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-premium-cyan w-100 py-2.5 fw-bold rounded-3 mb-3"
              >
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </form>

            <div className="text-center mt-3">
              <span className="text-muted small">Already have an account? </span>
              <Link to="/login" className="text-gradient fw-semibold small text-decoration-none">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
