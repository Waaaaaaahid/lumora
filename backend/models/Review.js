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

// A customer can review each product once. Admin testimonials are excluded from this index.
reviewSchema.index(
  { user: 1, item: 1 },
  {
    name: 'customer_user_item_unique',
    unique: true,
    partialFilterExpression: { source: 'customer', user: { $exists: true }, item: { $exists: true } },
  }
);
reviewSchema.index({ visible: 1, createdAt: -1 });

// Replace the legacy sparse compound index with the safer customer-only partial index.
reviewSchema.post('init', async function () {
  try {
    const collection = this.collection;
    const indexes = await collection.indexes();
    if (indexes.some((index) => index.name === 'user_1_item_1')) {
      await collection.dropIndex('user_1_item_1');
    }
    await collection.createIndex(
      { user: 1, item: 1 },
      {
        name: 'customer_user_item_unique',
        unique: true,
        partialFilterExpression: { source: 'customer', user: { $exists: true }, item: { $exists: true } },
      }
    );
  } catch (_) {
    // Index migration is best-effort; application validation still prevents duplicates.
  }
});

module.exports = mongoose.model('Review', reviewSchema);
