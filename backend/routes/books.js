const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const GUTENBERG_API = 'https://gutendex.com/books';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// ── Format a Google Books item ──
const formatBook = (item) => {
  const info = item.volumeInfo || {};
  return {
    googleId: item.id,
    title: info.title || 'Unknown Title',
    authors: info.authors || ['Unknown Author'],
    description: info.description || '',
    coverImage: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    categories: info.categories || [],
    publishedDate: info.publishedDate || '',
    totalPages: info.pageCount || 0,
    language: info.language || 'en',
    previewLink: info.previewLink || '',
    publisher: info.publisher || '',
    averageRating: info.averageRating || 0,
    ratingsCount: info.ratingsCount || 0,
    gutenbergId: null,
    hasFullContent: false,
    archiveId: null,
  };
};

// ── Search Gutenberg with better matching ──
const findGutenbergBook = async (title, author) => {
  try {
    const res = await axios.get(
      `${GUTENBERG_API}?search=${encodeURIComponent(title)}&languages=en`,
      { timeout: 6000 }
    );
    const books = res.data.results || [];
    if (books.length === 0) return null;

    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // Try exact / starts-with title match
    let match = books.find(b => {
      const bTitle = b.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      return bTitle === cleanTitle || bTitle.startsWith(cleanTitle) || cleanTitle.startsWith(bTitle);
    });

    // Try author last name match
    if (!match && author) {
      const lastName = author.toLowerCase().split(' ').pop();
      match = books.find(b =>
        b.authors?.some(a => a.name.toLowerCase().includes(lastName))
      );
    }

    // Fallback: first result
    if (!match) match = books[0];
    if (!match) return null;

    return {
      gutenbergId: match.id,
      coverImage: match.formats?.['image/jpeg'] || null,
    };
  } catch (err) {
    console.error('Gutenberg lookup error:', err.message);
    return null;
  }
};

// ── Search Open Library for Internet Archive embed ──
const findOpenLibraryBook = async (title, author) => {
  try {
    const query = encodeURIComponent(`${title} ${author || ''}`.trim());
    const res = await axios.get(
      `https://openlibrary.org/search.json?q=${query}&limit=5&fields=title,author_name,ia,number_of_pages_median,cover_i`,
      { timeout: 6000 }
    );
    const docs = res.data.docs || [];
    if (docs.length === 0) return null;

    const withArchive = docs.find(d => d.ia && d.ia.length > 0);
    const best = withArchive || docs[0];

    return {
      archiveId: best.ia?.[0] || null,
      totalPages: best.number_of_pages_median || 0,
    };
  } catch (err) {
    console.error('Open Library lookup error:', err.message);
    return null;
  }
};

// ── GET /api/books — category browse ──
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category = 'fiction', maxResults = 100 } = req.query;
    // Search OpenLibrary for books with text that have the subject
    const url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(category)}&limit=${maxResults}&has_fulltext=true`;
    
    // Map OL 3-letter codes to ISO 2-letter
    const langMap = { eng: 'en', hin: 'hi', fre: 'fr', ger: 'de', spa: 'es', ita: 'it', por: 'pt', rus: 'ru', chi: 'zh', jpn: 'ja', ara: 'ar', mar: 'mr', ben: 'bn' };

    const response = await axios.get(url);
    
    let docs = response.data.docs || [];
    // Only return books guaranteed to have public readability
    docs = docs.filter(doc => (doc.ia && doc.ia.length > 0) || (doc.id_project_gutenberg && doc.id_project_gutenberg.length > 0));

    const books = docs.map(doc => ({
      googleId: doc.key.replace('/works/', ''), // Generate pseudo ID
      title: doc.title || 'Unknown Title',
      authors: doc.author_name || ['Unknown Author'],
      description: doc.first_sentence ? doc.first_sentence[0] : '',
      coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      categories: [category],
      publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : '',
      totalPages: doc.number_of_pages_median || 0,
      language: (doc.language && doc.language[0]) ? (langMap[doc.language[0].toLowerCase()] || doc.language[0].substring(0, 2)) : 'en',
      hasFullContent: true, // we assume true because we searched for has_fulltext
      archiveId: doc.ia ? doc.ia[0] : null,
      gutenbergId: doc.id_project_gutenberg ? doc.id_project_gutenberg[0] : null
    }));
    
    res.json({ success: true, books });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});

// ── GET /api/books/search ──
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, maxResults = 100 } = req.query;
    if (!q) return res.status(400).json({ message: 'Query required' });
    
    // Search OpenLibrary
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${maxResults}&has_fulltext=true`;
    
    // Map OL 3-letter codes to ISO 2-letter
    const langMap = { eng: 'en', hin: 'hi', fre: 'fr', ger: 'de', spa: 'es', ita: 'it', por: 'pt', rus: 'ru', chi: 'zh', jpn: 'ja', ara: 'ar', mar: 'mr', ben: 'bn' };

    const response = await axios.get(url);
    
    let docs = response.data.docs || [];
    // Only return books guaranteed to have public readability
    docs = docs.filter(doc => (doc.ia && doc.ia.length > 0) || (doc.id_project_gutenberg && doc.id_project_gutenberg.length > 0));

    const books = docs.map(doc => ({
      googleId: doc.key.replace('/works/', ''), // Generate pseudo ID
      title: doc.title || 'Unknown Title',
      authors: doc.author_name || ['Unknown Author'],
      description: doc.first_sentence ? doc.first_sentence[0] : '',
      coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      categories: doc.subject ? doc.subject.slice(0, 3) : [],
      publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : '',
      totalPages: doc.number_of_pages_median || 0,
      language: (doc.language && doc.language[0]) ? (langMap[doc.language[0].toLowerCase()] || doc.language[0].substring(0, 2)) : 'en',
      hasFullContent: true, // we assume true because we searched for has_fulltext
      archiveId: doc.ia ? doc.ia[0] : null,
      gutenbergId: doc.id_project_gutenberg ? doc.id_project_gutenberg[0] : null
    }));
    
    res.json({ success: true, books });
  } catch (error) {
    res.status(500).json({ message: 'Error searching books', error: error.message });
  }
});

// ── GET /api/books/:bookId — single book + full content check ──
router.get('/:bookId', authMiddleware, async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Fetch work details from OpenLibrary
    const workRes = await axios.get(`https://openlibrary.org/works/${bookId}.json`);
    const work = workRes.data;
    
    // Fetch author details
    let authorName = 'Unknown Author';
    if (work.authors && work.authors.length > 0) {
        try {
            const authorRes = await axios.get(`https://openlibrary.org${work.authors[0].author.key}.json`);
            authorName = authorRes.data.name;
        } catch(e) { }
    }
    
    const title = work.title || 'Unknown Title';
    const description = typeof work.description === 'string' ? work.description : (work.description?.value || '');

    const book = {
      googleId: bookId,
      title: title,
      authors: [authorName],
      description: description,
      coverImage: work.covers && work.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : null,
      categories: work.subjects ? work.subjects.slice(0, 5) : [],
      publishedDate: '',
      totalPages: 0,
      language: 'en',
    };

    // ✅ Step 1: Try Gutenberg (our beautiful reader)
    const gutenbergData = await findGutenbergBook(book.title, authorName);

    if (gutenbergData?.gutenbergId) {
      book.gutenbergId = gutenbergData.gutenbergId;
      book.hasFullContent = true;
      book.contentSource = 'gutenberg';
      if (!book.coverImage && gutenbergData.coverImage) {
        book.coverImage = gutenbergData.coverImage;
      }
      console.log(`✅ Gutenberg: ${book.title} → ID ${book.gutenbergId}`);
    } else {
      // ✅ Step 2: Fallback to Internet Archive (iframe)
      const olData = await findOpenLibraryBook(book.title, authorName);
      if (olData?.archiveId) {
        book.archiveId = olData.archiveId;
        book.hasFullContent = true;
        book.contentSource = 'archive';
        if (olData.totalPages && !book.totalPages) book.totalPages = olData.totalPages;
        console.log(`📚 Archive: ${book.title} → ${book.archiveId}`);
      } else {
        book.contentSource = 'none';
        console.log(`❌ No content: ${book.title}`);
      }
    }

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book', error: error.message });
  }
});
// ── GET /api/books/gutenberg/:id — proxy book text to bypass CORS ──
router.get('/gutenberg/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const urls = [
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/files/${id}/${id}.txt`,
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, { responseType: 'text' });
      if (response.data && response.data.length > 1000) {
        return res.send(response.data);
      }
    } catch (_) { }
  }
  
  res.status(404).send('Text not available from Gutenberg.');
});

module.exports = router;