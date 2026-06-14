const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { protect } = require('../middleware/auth');

// Generate JWT Utility
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'shopez_jwt_secret_key_123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with that email or username' });
    }

    // Determine role (protect ADMIN creation: default to USER, but allow ADMIN if a security token is passed or just allow it for testing ease)
    // For local development and assessment, we'll allow role setting directly from req.body, but default to USER.
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: userRole,
    });

    if (user) {
      // Create empty Portfolio for this user
      await Portfolio.create({
        user: user._id,
        holdings: [],
      });

      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Create portfolio if it somehow doesn't exist yet
      const portfolioExists = await Portfolio.findOne({ user: user._id });
      if (!portfolioExists) {
        await Portfolio.create({ user: user._id, holdings: [] });
      }

      res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
