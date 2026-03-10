const express = require('express');
const passport = require('passport');
const router = express.Router();

// Start Google OAuth login
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=failed` }),
  (req, res) => {
    // Successful login → redirect to home
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/home`);
  }
);

// Get current logged in user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Not logged in' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout error' });
    res.json({ success: true, message: '✅ Logged out successfully' });
  });
});

module.exports = router;
