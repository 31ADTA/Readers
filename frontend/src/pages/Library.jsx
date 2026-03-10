import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Library.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const Library = () => {
  const [readingList, setReadingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/progress`, { withCredentials: true });
      setReadingList(res.data.progress || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (bookId) => {
    try {
      await axios.delete(`${API_URL}/api/progress/${bookId}`, { withCredentials: true });
      // Remove from list immediately
      setReadingList(prev => prev.filter(p => p.bookId !== bookId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (q) => navigate(`/home?search=${q}`);

  return (
    <div className="library-page">
      <Navbar onSearch={handleSearch} />
      <main className="library-main">
        <h1 className="library-heading">📚 My Library</h1>
        <p className="library-sub">Books you've started reading</p>

        {loading ? (
          <div className="loading-screen"><div className="spinner"></div></div>
        ) : readingList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>No books yet!</h3>
            <p>Start reading something to see it here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/home')}>Browse Books</button>
          </div>
        ) : (
          <div className="library-grid">
            {readingList.map(p => (
              <div key={p.bookId} className="library-card">

                {/* Delete confirmation popup */}
                {deleteConfirm === p.bookId && (
                  <div className="delete-confirm">
                    <p>Remove this book?</p>
                    <div className="delete-btns">
                      <button
                        className="confirm-yes"
                        onClick={() => handleDelete(p.bookId)}
                      >
                        ✅ Yes Remove
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Book cover */}
                <div
                  className="lib-cover"
                  onClick={() => navigate(`/reader/${p.bookId}`)}
                >
                  {p.bookCover
                    ? <img src={p.bookCover} alt={p.bookTitle} />
                    : <span>📖</span>
                  }
                </div>

                {/* Book info */}
                <div
                  className="lib-info"
                  onClick={() => navigate(`/reader/${p.bookId}`)}
                >
                  <h3>{p.bookTitle}</h3>
                  <p>Chapter {p.currentChapter || 1} • Page {p.currentPage}</p>
                  <p className="lib-date">Last read: {formatDate(p.lastReadAt)}</p>
                  <div className="lib-progress">
                    <div
                      className="lib-fill"
                      style={{ width: `${p.scrollPercentage || Math.min(100, (p.currentPage / 300) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="lib-percent">
                    {p.scrollPercentage || 0}% complete
                  </span>
                </div>

                {/* Buttons */}
                <div className="lib-actions">
                  <button
                    className="lib-btn"
                    onClick={() => navigate(`/reader/${p.bookId}`)}
                  >
                    Continue →
                  </button>
                  <button
                    className="lib-delete-btn"
                    onClick={() => setDeleteConfirm(p.bookId)}
                    title="Remove book"
                  >
                    🗑️
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

export default Library;