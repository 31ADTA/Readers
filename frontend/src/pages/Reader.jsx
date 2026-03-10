import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Reader.css';

const API_URL = process.env.REACT_APP_API_URL || '';
const WORDS_PER_PAGE = 400;
const MILESTONES = [10, 25, 50, 75, 90, 100];

// ── Fetch Gutenberg text via proxy ──
const fetchGutenbergText = async (gutenbergId) => {
  try {
    const res = await axios.get(`${API_URL}/api/books/gutenberg/${gutenbergId}`, { withCredentials: true });
    if (res.data && res.data.length > 1000) return res.data;
  } catch (err) {
    console.error("Gutenberg proxy error:", err);
  }
  return null;
};

// ── Split text into pages & generate Index ──
const processText = (rawText) => {
  let text = rawText;
  const startMarkers = ['*** START OF THE PROJECT GUTENBERG', '*** START OF THIS PROJECT GUTENBERG'];
  const endMarkers = ['*** END OF THE PROJECT GUTENBERG', '*** END OF THIS PROJECT GUTENBERG', 'End of the Project Gutenberg'];
  for (const m of startMarkers) {
    const idx = text.indexOf(m);
    if (idx !== -1) { text = text.slice(text.indexOf('\n', idx) + 1); break; }
  }
  for (const m of endMarkers) {
    const idx = text.indexOf(m);
    if (idx !== -1) { text = text.slice(0, idx); break; }
  }
  
  const blocks = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  const pages = [];
  const toc = [];
  
  let curPage = [];
  let curWordCount = 0;
  let pageIndex = 0;

  for (const block of blocks) {
    const rawSingleLine = block.replace(/\r?\n/g, ' ').trim();
    // Detect chapter headings (short lines in caps, or starting with CHAPTER/BOOK/Roman numerals)
    const isHeading = rawSingleLine.length < 150 && (
      /^CHAPTER\s+/i.test(rawSingleLine) || 
      /^BOOK\s+/i.test(rawSingleLine) || 
      /^PART\s+/i.test(rawSingleLine) || 
      /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\.?$/.test(rawSingleLine) ||
      (rawSingleLine === rawSingleLine.toUpperCase() && rawSingleLine.length > 4 && rawSingleLine.length < 50)
    ) && !rawSingleLine.includes('PROJECT GUTENBERG');

    if (isHeading) {
      if (curPage.length > 0) {
        pages.push(curPage);
        pageIndex++;
        curPage = [];
        curWordCount = 0;
      }
      toc.push({ title: rawSingleLine, page: pageIndex });
      curPage.push({ type: 'heading', text: rawSingleLine });
    } else {
      const w = rawSingleLine.split(/\s+/).length;
      if (curWordCount + w > WORDS_PER_PAGE && curPage.length > 0) {
        pages.push(curPage);
        pageIndex++;
        curPage = [{ type: 'paragraph', text: rawSingleLine }];
        curWordCount = w;
      } else {
        curPage.push({ type: 'paragraph', text: rawSingleLine });
        curWordCount += w;
      }
    }
  }
  if (curPage.length > 0) pages.push(curPage);
  
  return { pages, toc };
};

const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [textLoading, setTextLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [readMode, setReadMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState('dark');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const [clearedMilestones, setClearedMilestones] = useState([]);
  const [particles, setParticles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [streak, setStreak] = useState(0);
  const [readingMinutes, setReadingMinutes] = useState(0);

  const saveTimerRef = useRef(null);
  const readingTimerRef = useRef(null);
  const pageTopRef = useRef(null);

  // ✅ Safe content source - fallback to 'none' if undefined
  const contentSource = book?.contentSource || (book?.gutenbergId ? 'gutenberg' : book?.archiveId ? 'archive' : 'none');
  const totalPages = contentSource === 'gutenberg' ? (pages.length || 1) : (book?.totalPages || 100);
  const activePage = currentPage + 1;
  const accuratePercent = Math.min(100, Math.round((activePage / totalPages) * 100));
  const dailyProgress = Math.min(100, Math.round((readingMinutes / 30) * 100));

  const themes = {
    dark: { bg: '#0f0f0f', text: '#e8e0d0', paper: '#141414', border: '#2a2a2a' },
    sepia: { bg: '#f4e8c1', text: '#3d2b1f', paper: '#fdf6e3', border: '#d4b896' },
    light: { bg: '#f5f5f5', text: '#1a1a1a', paper: '#ffffff', border: '#e0e0e0' },
  };
  const t = themes[theme];

  useEffect(() => {
    loadBook();
    loadProgress();
    loadLocalData();
    checkStreak();
    return () => { clearInterval(saveTimerRef.current); clearInterval(readingTimerRef.current); };
  }, [bookId]);

  useEffect(() => {
    if (readMode) {
      readingTimerRef.current = setInterval(() => setReadingMinutes(m => m + 1), 60000);
      saveTimerRef.current = setInterval(saveProgress, 30000);

      // Load Google Viewer if content source is none
      if (contentSource === 'none' && window.google) {
        window.google.books.load();
        window.google.books.setOnLoadCallback(() => {
          const viewer = new window.google.books.DefaultViewer(document.getElementById('google-viewer-canvas'));
          viewer.load(book.googleId, () => console.log("Book loaded in Google Viewer"), () => console.log("Book NOT found in Google Viewer"));
        });
      }
    } else {
      clearInterval(saveTimerRef.current);
      clearInterval(readingTimerRef.current);
    }
    return () => { clearInterval(saveTimerRef.current); clearInterval(readingTimerRef.current); };
  }, [readMode, currentPage, contentSource, book]);

  useEffect(() => {
    if (!readMode) return;
    const hit = MILESTONES.find(m => accuratePercent >= m && !clearedMilestones.includes(m));
    if (hit) {
      setMilestone(hit);
      setClearedMilestones(prev => [...prev, hit]);
      spawnParticles();
      setTimeout(() => setMilestone(null), 3500);
    }
    if (pageTopRef.current) pageTopRef.current.scrollTop = 0;
  }, [currentPage, readMode]);

  const spawnParticles = () => {
    const p = Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: Math.random() * 0.5, color: ['#f6c90e', '#ff6b6b', '#4ecdc4', '#a8e6cf'][i % 4] }));
    setParticles(p);
    setTimeout(() => setParticles([]), 3000);
  };

  const checkStreak = () => {
    const last = localStorage.getItem(`streak_${bookId}_last`);
    const count = parseInt(localStorage.getItem(`streak_${bookId}_count`) || '0');
    const today = new Date().toDateString();
    if (last === today) { setStreak(count); }
    else if (last === new Date(Date.now() - 86400000).toDateString()) {
      const n = count + 1; setStreak(n);
      localStorage.setItem(`streak_${bookId}_count`, n);
      localStorage.setItem(`streak_${bookId}_last`, today);
    } else {
      setStreak(1);
      localStorage.setItem(`streak_${bookId}_count`, 1);
      localStorage.setItem(`streak_${bookId}_last`, today);
    }
  };

  const loadLocalData = () => {
    try {
      const bm = localStorage.getItem(`bookmarks_${bookId}`);
      if (bm) setBookmarks(JSON.parse(bm));
      const nt = localStorage.getItem(`notes_${bookId}`);
      if (nt) setNotes(JSON.parse(nt));
      const ms = localStorage.getItem(`milestones_${bookId}`);
      if (ms) setClearedMilestones(JSON.parse(ms));
    } catch (_) { }
  };

  const addBookmark = () => {
    const bm = { page: activePage, date: new Date().toLocaleDateString() };
    const updated = [...bookmarks, bm];
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${bookId}`, JSON.stringify(updated));
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  };

  const addNote = () => {
    if (!note.trim()) return;
    const updated = [...notes, { page: activePage, text: note, date: new Date().toLocaleDateString() }];
    setNotes(updated);
    localStorage.setItem(`notes_${bookId}`, JSON.stringify(updated));
    setNote('');
  };

  const loadBook = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/books/${bookId}`, { withCredentials: true });
      let bookData = res.data.book;
      
      // Fetch Gutenberg text if available
      if (bookData.gutenbergId) {
        setTextLoading(true);
        const text = await fetchGutenbergText(bookData.gutenbergId);
        if (text) {
          const processed = processText(text);
          setPages(processed.pages);
          setToc(processed.toc);
        } else {
          // If Gutenberg text failed, gracefully fallback to archive iframe
          if (bookData.archiveId) {
             bookData = { ...bookData, contentSource: 'archive' };
          }
        }
        setTextLoading(false);
      }
      
      setBook(bookData);
    } catch (err) {
      console.error('loadBook error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/progress/${bookId}`, { withCredentials: true });
      if (res.data.progress) {
        const s = res.data.progress;
        setProgress(s);
        setCurrentPage(Math.max(0, (s.currentPage || 1) - 1));
        setReadingMinutes(s.totalReadingMinutes || 0);
      }
    } catch (_) { }
  };

  const saveProgress = useCallback(async () => {
    if (!book) return;
    try {
      await axios.post(`${API_URL}/api/progress/save`, {
        bookId, bookTitle: book.title, bookCover: book.coverImage,
        currentPage: activePage, totalPages,
        currentChapter: Math.max(1, Math.ceil((activePage / totalPages) * 20)),
        currentChapterTitle: `Page ${activePage}`, totalChapters: 20,
        scrollPosition: activePage, scrollPercentage: accuratePercent,
        readingMinutesAdded: 0, isCompleted: accuratePercent >= 98
      }, { withCredentials: true });
      setProgress(prev => ({ ...prev, currentPage: activePage, scrollPercentage: accuratePercent }));
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    } catch (_) { }
  }, [book, bookId, activePage, totalPages, accuratePercent]);

  // ── Loading ──
  if (loading) return (
    <div className="rd-loading">
      <div className="rd-loading-book">📖</div>
      <p>Opening book...</p>
    </div>
  );

  if (!book) return (
    <div className="rd-loading">
      <p style={{ color: '#e8e0d0' }}>Book not found.</p>
      <button onClick={() => navigate('/home')} style={{ marginTop: 16, padding: '10px 24px', background: '#c9a84c', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>← Back to Home</button>
    </div>
  );

  // ── FULLSCREEN READ MODE ──
  if (readMode) {
    return (
      <div className="rd-fullscreen" style={{ background: t.bg }}>

        {particles.map(p => (
          <div key={p.id} className="rd-particle" style={{ left: `${p.x}%`, animationDelay: `${p.delay}s`, background: p.color }} />
        ))}

        {milestone && (
          <div className="rd-milestone">
            <div className="rd-milestone-inner" style={{ background: t.paper }}>
              <span className="rd-milestone-emoji">{milestone === 100 ? '🏆' : milestone >= 75 ? '🔥' : '🎉'}</span>
              <h3>{milestone}% Complete!</h3>
              <p>{milestone === 100 ? 'You finished the book!' : 'Keep going!'}</p>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="rd-topbar" style={{ background: t.paper, borderColor: t.border }}>
          <button className="rd-back-btn" style={{ borderColor: t.border, color: t.text }} onClick={() => { saveProgress(); setReadMode(false); }}>
            ← Back
          </button>
          <div className="rd-topbar-center">
            <span className="rd-topbar-title" style={{ color: t.text }}>{book.title}</span>
            <span className="rd-topbar-sub">Page {activePage} of {totalPages} · {accuratePercent}%</span>
          </div>
          <div className="rd-topbar-actions">
            {streak > 0 && <span className="rd-streak">🔥 {streak}</span>}
            <button className="rd-icon-btn" style={{ borderColor: t.border }} onClick={() => {
              const order = ['dark', 'sepia', 'light'];
              setTheme(order[(order.indexOf(theme) + 1) % 3]);
            }}>{theme === 'dark' ? '🌙' : theme === 'sepia' ? '📜' : '☀️'}</button>
            <button className="rd-icon-btn" style={{ borderColor: t.border, color: t.text }} onClick={() => setFontSize(f => Math.max(14, f - 2))}>A-</button>
            <button className="rd-icon-btn" style={{ borderColor: t.border, color: t.text }} onClick={() => setFontSize(f => Math.min(26, f + 2))}>A+</button>
            <button className="rd-icon-btn" style={{ borderColor: t.border }} onClick={addBookmark}>🔖</button>
            <button className="rd-icon-btn" style={{ borderColor: t.border, background: showToc ? '#c9a84c' : 'transparent', color: showToc ? '#0f0f0f' : t.text }} onClick={() => { setShowToc(s => !s); setShowNotes(false); setShowBookmarks(false); }}>📑</button>
            <button className="rd-icon-btn" style={{ borderColor: t.border }} onClick={() => { setShowNotes(s => !s); setShowBookmarks(false); setShowToc(false); }}>📝</button>
            <button className="rd-icon-btn" style={{ borderColor: t.border }} onClick={() => { setShowBookmarks(s => !s); setShowNotes(false); setShowToc(false); }}>📚</button>
            <button className="rd-save-btn" onClick={saveProgress}>{savedIndicator ? '✅' : '💾 Save'}</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="rd-progress-track" style={{ background: t.border }}>
          <div className="rd-progress-fill" style={{ width: `${accuratePercent}%` }} />
        </div>

        {/* Daily goal */}
        <div className="rd-daily-bar" style={{ background: t.paper, borderColor: t.border }}>
          <span style={{ fontSize: 11, color: t.text, fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>🎯 Daily Goal</span>
          <div className="rd-daily-track"><div className="rd-daily-fill" style={{ width: `${dailyProgress}%` }} /></div>
          <span style={{ fontSize: 11, color: '#4ecdc4', fontWeight: 700, flexShrink: 0 }}>{readingMinutes}/30m</span>
        </div>

        {/* TOC panel */}
        {showToc && (
          <div className="rd-panel" style={{ background: t.paper, borderColor: t.border }}>
            <div className="rd-panel-header" style={{ borderColor: t.border }}>
              <h3 style={{ color: t.text }}>📑 Index</h3>
              <button onClick={() => setShowToc(false)} style={{ color: t.text, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="rd-panel-body">
              {toc.length === 0 ? <p className="rd-empty" style={{ color: t.text }}>No chapter index found.</p>
                : toc.map((item, i) => (
                  <div key={i} className="rd-bookmark-item" style={{ borderColor: t.border }} onClick={() => { setCurrentPage(item.page); setShowToc(false); }}>
                    <span className="rd-bm-page" style={{ fontWeight: 600 }}>{item.title}</span>
                    <span style={{ fontSize: 11, color: t.text, opacity: 0.6 }}>Page {item.page + 1}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bookmarks panel */}
        {showBookmarks && (
          <div className="rd-panel" style={{ background: t.paper, borderColor: t.border }}>
            <div className="rd-panel-header" style={{ borderColor: t.border }}>
              <h3 style={{ color: t.text }}>🔖 Bookmarks</h3>
              <button onClick={() => setShowBookmarks(false)} style={{ color: t.text, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="rd-panel-body">
              {bookmarks.length === 0 ? <p className="rd-empty" style={{ color: t.text }}>No bookmarks yet!</p>
                : bookmarks.map((bm, i) => (
                  <div key={i} className="rd-bookmark-item" style={{ borderColor: t.border }} onClick={() => { setCurrentPage(bm.page - 1); setShowBookmarks(false); }}>
                    <span className="rd-bm-page">Page {bm.page}</span>
                    <span style={{ fontSize: 11, color: t.text, opacity: 0.5 }}>{bm.date}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Notes panel */}
        {showNotes && (
          <div className="rd-panel" style={{ background: t.paper, borderColor: t.border }}>
            <div className="rd-panel-header" style={{ borderColor: t.border }}>
              <h3 style={{ color: t.text }}>📝 Notes</h3>
              <button onClick={() => setShowNotes(false)} style={{ color: t.text, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="rd-panel-body">
              <div className="rd-note-input-wrap">
                <textarea className="rd-note-input" style={{ background: t.bg, color: t.text, borderColor: t.border }} placeholder={`Note for page ${activePage}...`} value={note} onChange={e => setNote(e.target.value)} rows={3} />
                <button className="rd-note-add-btn" onClick={addNote}>Add</button>
              </div>
              {notes.map((n, i) => (
                <div key={i} className="rd-note-item" style={{ borderColor: t.border }}>
                  <span className="rd-note-page">Page {n.page} · {n.date}</span>
                  <p className="rd-note-text" style={{ color: t.text }}>{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book text area */}
        <div className="rd-book-area" ref={pageTopRef} style={{ background: t.bg }}>
          {contentSource === 'archive' ? (
             <iframe
               title="Internet Archive Book Reader"
               src={`https://archive.org/stream/${book.archiveId}?ui=embed`}
               width="100%"
               height="100%"
               frameBorder="0"
               allowFullScreen
               style={{ minHeight: '80vh' }}
             />
          ) : contentSource === 'none' ? (
             <div id="google-viewer-canvas" style={{ width: '100%', height: '80vh', background: t.paper }}></div>
          ) : textLoading ? (
            <div className="rd-text-loading">
              <div style={{ fontSize: 48 }}>📖</div>
              <p style={{ color: t.text }}>Loading book text...</p>
            </div>
          ) : pages.length > 0 ? (
            <div className="rd-page-content" style={{ background: t.paper, borderColor: t.border }}>
              <div className="rd-text-body" style={{ fontSize: `${fontSize}px`, color: t.text }}>
                {pages[currentPage]?.map((block, i) => (
                  block.type === 'heading'
                    ? <h2 key={i} className="rd-chapter-heading" style={{ color: '#c9a84c', textAlign: 'center', marginTop: '40px', marginBottom: '30px' }}>{block.text}</h2>
                    : <p key={i} className="rd-paragraph" style={{ color: t.text }}>{block.text}</p>
                ))}
              </div>
              <div className="rd-page-nav">
                <button className="rd-nav-btn" style={{ borderColor: t.border, color: t.text, opacity: currentPage === 0 ? 0.3 : 1 }} onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>← Previous</button>
                <div className="rd-page-info">
                  <span className="rd-page-num" style={{ color: t.text }}>Page {currentPage + 1}</span>
                  <span style={{ fontSize: 11, color: '#c9a84c' }}>of {totalPages}</span>
                </div>
                <button className="rd-nav-btn" style={{ borderColor: t.border, color: t.text, opacity: currentPage >= totalPages - 1 ? 0.3 : 1 }} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>Next →</button>
              </div>
            </div>
          ) : (
            <div className="rd-text-error">
              <p style={{ color: t.text, fontSize: 18 }}>⚠️ Book text not available.</p>
              <p style={{ color: t.text, opacity: 0.6, marginTop: 8 }}>This book may not be on Project Gutenberg.</p>
              <button onClick={() => setReadMode(false)} style={{ marginTop: 20, padding: '10px 24px', background: '#c9a84c', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>← Go Back</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── BOOK INFO PAGE ──
  return (
    <div className="rd-info-page">
      {book.coverImage && <div className="rd-bg-blur" style={{ backgroundImage: `url(${book.coverImage})` }} />}
      <div className="rd-bg-overlay" />

      <div className="rd-header">
        <button className="rd-header-back" onClick={() => navigate('/home')}>← Back</button>
        {streak > 0 && <span className="rd-header-streak">🔥 {streak} day streak</span>}
      </div>

      <div className="rd-info-content">
        <div className="rd-hero">

          {/* Cover */}
          <div className="rd-cover-wrap">
            {book.coverImage
              ? <img src={book.coverImage} alt={book.title} className="rd-cover" />
              : <div className="rd-cover-generated">
                <span className="rd-gen-emoji">📖</span>
                <p className="rd-gen-title">{book.title}</p>
                <p className="rd-gen-author">{book.authors?.[0]}</p>
              </div>
            }
            {progress?.scrollPercentage > 0 && <div className="rd-cover-badge">{progress.scrollPercentage}%</div>}
          </div>

          <div className="rd-hero-info">
            <div className="rd-book-tags">
              {book.categories?.slice(0, 2).map(c => <span key={c} className="rd-tag">{c}</span>)}
              {book.language && <span className="rd-tag rd-lang-tag">🌐 {book.language.toUpperCase()}</span>}
            </div>

            <h1 className="rd-book-title">{book.title}</h1>
            <p className="rd-book-author">by {book.authors?.join(', ')}</p>
            {book.publishedDate && <p className="rd-pub-date">📅 {book.publishedDate}</p>}

            {/* Badge */}
            {book.gutenbergId
              ? <div className="rd-content-badge rd-badge-full">✅ Full Book Available · Project Gutenberg</div>
              : book.archiveId
                ? <div className="rd-content-badge rd-badge-full" style={{ background: 'rgba(68, 207, 108, 0.1)', borderColor: 'rgba(68, 207, 108, 0.3)', color: '#44cf6c' }}>✅ Available via Internet Archive</div>
                : <div className="rd-content-badge rd-badge-preview">⚠️ Text Not Found</div>
            }

            {/* Progress */}
            {progress?.currentPage > 0 && (
              <div className="rd-progress-card">
                <div className="rd-progress-card-bar">
                  <div className="rd-progress-card-fill" style={{ width: `${progress.scrollPercentage || 0}%` }} />
                </div>
                <div className="rd-progress-card-stats">
                  <span>📄 Page {progress.currentPage}</span>
                  <span>✅ {progress.scrollPercentage || 0}%</span>
                </div>
              </div>
            )}

            {/* Button */}
            <div className="rd-cta-wrap">
              {textLoading
                ? <button className="rd-cta-btn rd-cta-loading" disabled>⏳ Loading book...</button>
                : <button className="rd-cta-btn" onClick={() => setReadMode(true)}>
                    {progress?.currentPage > 1 ? `▶ Continue · Page ${progress.currentPage}` : '📖 Start Reading Natively'}
                  </button>
              }
            </div>

            {book.gutenbergId && <p className="rd-cta-note">🎨 Dark · Sepia · Light themes + A- A+ font size!</p>}
          </div>
        </div>

        {/* About */}
        <div className="rd-about-card">
          <h3 className="rd-section-heading">About this book</h3>
          <p className="rd-description">{book.description || 'No description available.'}</p>
          <div className="rd-book-meta-row">
            {book.totalPages > 0 && <div className="rd-meta-chip">📄 {book.totalPages} pages</div>}
            {book.publisher && <div className="rd-meta-chip">🏢 {book.publisher}</div>}
            {book.averageRating > 0 && <div className="rd-meta-chip">⭐ {book.averageRating}/5</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;