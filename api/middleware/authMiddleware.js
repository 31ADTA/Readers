const authMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: '❌ Unauthorized. Please login with Gmail.' });
};

module.exports = authMiddleware;
