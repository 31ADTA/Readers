import { useNavigate } from 'react-router-dom';
import './BookCard.css';

// Language code to full name + flag mapping
const LANGUAGE_MAP = {
  en: { name: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  fr: { name: 'French', flag: '🇫🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  it: { name: 'Italian', flag: '🇮🇹' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
  bn: { name: 'Bengali', flag: '🇧🇩' },
  ur: { name: 'Urdu', flag: '🇵🇰' },
  ta: { name: 'Tamil', flag: '🇮🇳' },
  te: { name: 'Telugu', flag: '🇮🇳' },
  mr: { name: 'Marathi', flag: '🇮🇳' },
  gu: { name: 'Gujarati', flag: '🇮🇳' },
};

const getLanguageInfo = (code) => {
  if (!code) return { name: 'Unknown', flag: '🌐' };
  const lang = LANGUAGE_MAP[code.toLowerCase()];
  return lang || { name: code.toUpperCase(), flag: '🌐' };
};

const BookCard = ({ book }) => {
  const navigate = useNavigate();
  const langInfo = getLanguageInfo(book.language);

  return (
    <div className="book-card" onClick={() => navigate(`/reader/${book.googleId}`)}>

      {/* Language badge - top left corner */}
      <div className="lang-badge" title={`Language: ${langInfo.name}`}>
        {langInfo.flag} {langInfo.name}
      </div>

      {/* Book Cover */}
      <div className="book-cover">
        {book.coverImage
          ? <img src={book.coverImage} alt={book.title} />
          : <div className="no-cover">📖</div>
        }
      </div>

      {/* Book Info */}
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.authors?.join(', ')}</p>

        {/* Categories */}
        {book.categories?.length > 0 && (
          <div className="book-categories">
            {book.categories.slice(0, 2).map(c => (
              <span key={c} className="category-tag">{c}</span>
            ))}
          </div>
        )}

        {/* Language row */}
        <div className="book-language-row">
          <span className="lang-full">
            {langInfo.flag} {langInfo.name}
          </span>
          {book.totalPages && (
            <span className="book-pages">{book.totalPages} pages</span>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookCard;