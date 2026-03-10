# 📚 PageTurn - Book Reading Website

A full-stack book reading website with Gmail authentication, Google Books API, reading progress tracking (like Hotstar!), and MongoDB.

---

## 🛠️ Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Auth**: Google OAuth 2.0 (Gmail only)
- **Books**: Google Books API

---

## 🚀 Setup Guide (Step by Step)

### Step 1: Get MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/atlas
2. Sign up for free
3. Create a cluster → Click "Connect" → Copy connection string
4. It looks like: `mongodb+srv://username:password@cluster.mongodb.net/bookreader`

### Step 2: Get Google OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create new project
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth Client ID"
5. Choose "Web Application"
6. Add Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

### Step 3: Get Google Books API Key
1. In same Google Console → "APIs & Services" → "Library"
2. Search "Books API" → Enable it
3. Go to Credentials → "Create API Key"
4. Copy the API Key

### Step 4: Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env file with all the keys above
npm run dev
```

### Step 5: Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Fill in REACT_APP_GOOGLE_CLIENT_ID
npm start
```

### Step 6: Open the website
Go to: http://localhost:3000

---

## 📁 Project Structure
```
book-reading-website/
├── backend/
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── middleware/      # Auth protection
│   ├── config/         # DB + Passport setup
│   └── server.js       # Main server
└── frontend/
    └── src/
        ├── pages/      # Login, Home, Reader, Library
        ├── components/ # Navbar, BookCard
        └── context/    # Auth state
```

---

## ✅ Features
- 🔐 Gmail-only login (Google OAuth)
- 📖 Search millions of books via Google Books API
- 📍 Auto-saves reading progress every 30 seconds
- ▶️ "Continue Reading" — resume exactly where you left off
- 📚 Personal library page
- 🌙 Beautiful dark theme
