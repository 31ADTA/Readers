const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: String, required: true },
  bookTitle: { type: String },
  bookCover: { type: String },

  // Page tracking
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 0 },

  // Chapter tracking
  currentChapter: { type: Number, default: 1 },
  currentChapterTitle: { type: String, default: '' },
  totalChapters: { type: Number, default: 0 },

  // Scroll tracking (most accurate for auto resume)
  scrollPosition: { type: Number, default: 0 },
  scrollPercentage: { type: Number, default: 0 },

  // Time tracking
  totalReadingMinutes: { type: Number, default: 0 },
  lastReadAt: { type: Date, default: Date.now },

  // Status
  isCompleted: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

progressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);