const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('dotenv').config();
require('./config/passport');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const progressRoutes = require('./routes/progress');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions' 
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));
// Fix proxy trust for deployed environments (Vercel)
app.set('trust proxy', 1);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/progress', progressRoutes);

app.get('/', (req, res) => res.json({ message: '📚 Book Reading API is running!' }));
// Vercel Serverless Check
app.get('/api', (req, res) => res.json({ message: '📚 Backend API Router is active on Vercel!' }));

// Connect MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected!');
    // Only listen if not injected by Vercel serverless (so local dev works)
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    }
  })
  .catch(err => console.error('❌ MongoDB error:', err));

// Export for Vercel Serverless
module.exports = app;
