// Add one editable sample portfolio project on a fresh database.
// Admins can edit, hide or delete this project from Admin > Our Work.
const PortfolioProject = require('../models/PortfolioProject');

const DEMO_PROJECT = {
  title: 'Warm Minimal Kitchen',
  category: 'Kitchen Interior',
  description: 'A calm, contemporary kitchen designed around warm natural finishes, clean lines and practical storage. Soft under-cabinet lighting highlights the textured backsplash, while the neutral palette keeps the space bright, welcoming and timeless.',
  location: 'New Delhi',
  images: [
    {
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85',
      alt: 'Warm modern kitchen with natural finishes',
    },
    {
      url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85',
      alt: 'Contemporary interior with warm neutral tones',
    },
    {
      url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85',
      alt: 'Minimal interior design detail',
    },
  ],
  featured: true,
  published: true,
  sortOrder: 0,
};

async function ensurePortfolioDemoSeeded() {
  const existing = await PortfolioProject.exists({});
  if (existing) return { seeded: false };

  await PortfolioProject.create(DEMO_PROJECT);
  console.log('Seeded the editable Warm Minimal Kitchen portfolio demo.');
  return { seeded: true };
}

module.exports = ensurePortfolioDemoSeeded;
