import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookCard from '../components/BookCard';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL;

const LANGUAGES = [
  { code: '', label: '🌐 All', },
  { code: 'en', label: '🇬🇧 English', },
  { code: 'hi', label: '🇮🇳 Hindi', },
  { code: 'fr', label: '🇫🇷 French', },
  { code: 'de', label: '🇩🇪 German', },
  { code: 'es', label: '🇪🇸 Spanish', },
  { code: 'it', label: '🇮🇹 Italian', },
  { code: 'pt', label: '🇵🇹 Portuguese', },
  { code: 'ru', label: '🇷🇺 Russian', },
  { code: 'zh', label: '🇨🇳 Chinese', },
  { code: 'ja', label: '🇯🇵 Japanese', },
  { code: 'ar', label: '🇸🇦 Arabic', },
  { code: 'mr', label: '🇮🇳 Marathi', },
  { code: 'bn', label: '🇧🇩 Bengali', },
];

const CATEGORIES = [
  'fiction', 'mystery', 'romance', 'science',
  'history', 'biography', 'fantasy', 'thriller'
];

const Home = () => {
  const [books, setBooks] = useState([]);
  const [continueReading, setContinueReading] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('fiction');
  const [selectedLang, setSelectedLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) {
      setSearchQuery(q);
      searchBooks(q, 'en');
    } else {
      fetchBooks('fiction', 'en');
    }
    fetchContinueReading();
  }, []);

  const fetchBooks = async (cat, lang) => {
    setLoading(true);
    try {
      // Request more books so after filtering enough remain
      let url = `${API_URL}/api/books?category=${cat}&maxResults=40`;
      if (lang) url += `&langRestrict=${lang}`;
      const res = await axios.get(url, { withCredentials: true });
      let books = res.data.books || [];

      // ✅ FIX: Filter on frontend too because Google API is not always accurate
      if (lang) {
        books = books.filter(b => b.language === lang);
      }

      setBooks(books);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async (q, lang) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/books/search?q=${encodeURIComponent(q)}&maxResults=40`;
      if (lang) url += `&langRestrict=${lang}`;
      const res = await axios.get(url, { withCredentials: true });
      let books = res.data.books || [];

      // ✅ FIX: Filter on frontend too
      if (lang) {
        books = books.filter(b => b.language === lang);
      }

      setBooks(books);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContinueReading = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/progress`, { withCredentials: true });
      setContinueReading((res.data.progress || []).slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLangChange = (langCode) => {
    setSelectedLang(langCode);
    setSearchQuery('');
    fetchBooks(category, langCode);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSearchQuery('');
    fetchBooks(cat, selectedLang);
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    searchBooks(q, selectedLang);
  };

  return (
    <div className="home-page">
      <Navbar onSearch={handleSearch} />

      <main className="home-main">

        {/* Continue Reading */}
        {continueReading.length > 0 && (
          <section className="continue-section">
            <h2 className="section-title">▶ Continue Reading</h2>
            <div className="continue-grid">
              {continueReading.map(p => (
                <div
                  key={p.bookId}
                  className="continue-card"
                  onClick={() => navigate(`/reader/${p.bookId}`)}
                >
                  {p.bookCover
                    ? <img src={p.bookCover} alt={p.bookTitle} className="continue-cover" />
                    : <div className="continue-no-cover">📖</div>
                  }
                  <div className="continue-info">
                    <p className="continue-title">{p.bookTitle}</p>
                    <p className="continue-chapter">
                      Chapter {p.currentChapter || 1} • {p.scrollPercentage || 0}%
                    </p>
                    <div className="continue-bar">
                      <div
                        className="continue-fill"
                        style={{ width: `${p.scrollPercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Language Filter */}
        <section className="filter-section">
          <h2 className="section-title">🌐 Filter by Language</h2>
          <div className="lang-filters">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`lang-filter-btn ${selectedLang === lang.code ? 'active' : ''}`}
                onClick={() => handleLangChange(lang.code)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* Category Filter */}
        <section className="category-section">
          <div className="category-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Books */}
        <section className="books-section">
          <h2 className="section-title">
            {searchQuery
              ? `🔍 Results for "${searchQuery}"`
              : `📚 ${category.charAt(0).toUpperCase() + category.slice(1)} Books`}
            {selectedLang && (
              <span className="lang-active-label">
                {LANGUAGES.find(l => l.code === selectedLang)?.label}
              </span>
            )}
          </h2>

          {loading ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : books.length === 0 ? (
            <div className="empty-state">
              <p>No books found in this language. Try 🌐 All or different category!</p>
            </div>
          ) : (
            <div className="books-grid">
              {books.map(book => (
                <BookCard key={book.googleId} book={book} />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default Home;