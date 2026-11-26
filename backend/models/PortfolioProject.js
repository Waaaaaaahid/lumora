const mongoose = require('mongoose');

const portfolioProjectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  location: { type: String, trim: true, default: '' },
  images: [{
    url: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    publicId: { type: String, default: '' },
    alt: { type: String, trim: true, default: '' },
  }],
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

portfolioProjectSchema.index({ published: 1, sortOrder: 1, createdAt: -1 });

module.exports = mongoose.model('PortfolioProject', portfolioProjectSchema);
