import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <nav className="navbar">
      <Link to="/home" className="nav-logo">📚 PageTurn</Link>

      <form className="nav-search" onSubmit={handleSearch}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search books, authors..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="nav-links">
        <Link to="/library" className="nav-link">My Library</Link>
        <div className="nav-user" onClick={() => setShowMenu(!showMenu)}>
          {user?.profilePicture
            ? <img src={user.profilePicture} alt={user.name} className="avatar" />
            : <div className="avatar-fallback">{user?.name?.[0]}</div>
          }
          {showMenu && (
            <div className="user-menu">
              <div className="user-info">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <hr />
              <button onClick={logout}>🚪 Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
