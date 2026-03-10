const express = require('express');
const Progress = require('../models/Progress');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Save or update reading progress
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { bookId, bookTitle, bookCover, currentPage, currentLine, scrollPosition, totalPagesRead, isCompleted } = req.body;
    const userId = req.user._id;

    const progress = await Progress.findOneAndUpdate(
      { userId, bookId },
      {
        bookTitle,
        bookCover,
        currentPage,
        currentLine,
        scrollPosition: scrollPosition || 0,
        totalPagesRead: totalPagesRead || currentPage,
        isCompleted: isCompleted || false,
        lastReadAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ message: 'Error saving progress', error: error.message });
  }
});

// Get progress for a specific book
router.get('/:bookId', authMiddleware, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ userId, bookId });

    if (!progress) {
      return res.json({ success: true, progress: null });
    }

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Get ALL books user has started reading (for Continue Reading section)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const allProgress = await Progress.find({ userId, isCompleted: false })
      .sort({ lastReadAt: -1 })
      .limit(10);

    res.json({ success: true, progress: allProgress });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reading list', error: error.message });
  }
});

// Delete progress for a book
router.delete('/:bookId', authMiddleware, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    await Progress.findOneAndDelete({ userId, bookId });
    res.json({ success: true, message: 'Progress deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting progress', error: error.message });
  }
});

module.exports = router;
