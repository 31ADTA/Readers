const express = require('express');
const passport = require('passport');
const router = express.Router();

const ensureGoogleStrategy = (req, res, next) => {
  if (!passport._strategy('google')) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    });
  }
  return next();
};

// Start Google OAuth login
router.get('/google', ensureGoogleStrategy,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback', ensureGoogleStrategy, (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
  passport.authenticate('google', {
    failureRedirect: `${clientUrl}/login?error=failed`
  })(req, res, next);
}, (req, res) => {
  const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
  res.redirect(`${clientUrl}/home`);
});

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
