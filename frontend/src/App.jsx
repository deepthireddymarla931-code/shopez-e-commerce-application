import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import StockDetails from './pages/StockDetails';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1 container px-3">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/stock/:symbol" element={<StockDetails />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
          <footer className="py-4 text-center mt-5 border-top border-secondary border-opacity-10 text-muted small">
            <div className="container">
              © {new Date().getFullYear()} ShopEZ Stock Trader. Powered by MERN Stack & simulated real-time data feeds.
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
