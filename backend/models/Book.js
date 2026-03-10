const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  googleBookId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  authors: [{ type: String }],
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  totalPages: { type: Number, default: 0 },
  categories: [{ type: String }],
  publishedDate: { type: String },
  previewLink: { type: String },
  infoLink: { type: String },
  fetchedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
