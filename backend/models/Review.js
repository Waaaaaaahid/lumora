const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Each customer review is linked to one specific product.
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, required: true },
    authorName: { type: String, trim: true, maxlength: 80, required: true },
    authorRole: { type: String, trim: true, maxlength: 80 },
    source: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    visible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A customer can review each product once, even if it appears in multiple orders.
reviewSchema.index({ user: 1, item: 1 }, { unique: true, sparse: true });
reviewSchema.index({ visible: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
