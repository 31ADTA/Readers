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
let dbConnectionPromise;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not set. Database-backed routes will fail until it is configured.');
    return;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(process.env.MONGODB_URI);
  }

  await dbConnectionPromise;
};

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const sessionOptions = {
  secret: process.env.JWT_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
};

if (process.env.MONGODB_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  });
}

app.use(session(sessionOptions));
app.set('trust proxy', 1);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/progress', progressRoutes);

app.get('/', (req, res) => res.json({ message: '📚 Book Reading API is running!' }));
app.get('/api', (req, res) => res.json({ message: '📚 Backend API Router is active on Vercel!' }));

app.use((err, req, res, next) => {
  console.error('❌ API error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => console.error('❌ MongoDB error:', err));
}

module.exports = app;
