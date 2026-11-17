// Ensure the four interior portfolio projects exist in MongoDB.
// Safe to run on every backend startup: existing admin edits are never overwritten.
const PortfolioProject = require('../models/PortfolioProject');

const PROJECTS = [
  {
    title: 'Modern Luxury Living Room',
    category: 'Living Room Interior',
    description: 'A refined living space with sculptural furniture, warm wood finishes, layered lighting and a calm neutral palette. The open layout balances everyday comfort with an elegant, contemporary feel.',
    location: 'New Delhi',
    images: [
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85', alt: 'Modern living room with warm neutral furniture' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85', alt: 'Contemporary living space with natural finishes' },
    ],
    featured: true, published: true, sortOrder: 1,
  },
  {
    title: 'Contemporary Master Bedroom',
    category: 'Bedroom Interior',
    description: 'A restful master bedroom featuring soft layered textiles, a statement upholstered headboard, subtle ambient lighting and understated finishes for a serene hotel-inspired atmosphere.',
    location: 'New Delhi',
    images: [
      { url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=85', alt: 'Contemporary bedroom interior' },
      { url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=85', alt: 'Warm modern bedroom styling' },
    ],
    featured: false, published: true, sortOrder: 2,
  },
  {
    title: 'Elegant Modular Kitchen',
    category: 'Modular Kitchen',
    description: 'A practical modular kitchen with streamlined cabinetry, generous storage, durable surfaces and task-focused lighting. Clean geometry and a balanced material palette make the space both functional and inviting.',
    location: 'New Delhi',
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85', alt: 'Modern home kitchen with clean cabinetry' },
      { url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85', alt: 'Minimal contemporary kitchen detail' },
    ],
    featured: false, published: true, sortOrder: 3,
  },
  {
    title: 'Premium Contemporary Office',
    category: 'Commercial Interior',
    description: 'A polished workspace designed for focus and collaboration, combining ergonomic planning, warm timber accents, uncluttered surfaces and layered lighting in a professional contemporary setting.',
    location: 'New Delhi',
    images: [
      { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85', alt: 'Contemporary office interior' },
      { url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85', alt: 'Modern collaborative office space' },
    ],
    featured: false, published: true, sortOrder: 4,
  },
];

async function ensureInteriorProjectsSeeded() {
  let inserted = 0;

  for (const project of PROJECTS) {
    // Match by title so repeated restarts cannot create duplicate records.
    // $setOnInsert preserves any edits already made by the admin dashboard.
    const result = await PortfolioProject.updateOne(
      { title: project.title },
      { $setOnInsert: project },
      { upsert: true, runValidators: true },
    );
    if (result.upsertedCount) inserted += 1;
  }

  const total = await PortfolioProject.countDocuments({
    title: { $in: PROJECTS.map((project) => project.title) },
  });
  console.log(`Our Work backend seed check complete: ${total}/${PROJECTS.length} projects exist; inserted ${inserted} new projects.`);
  return { inserted, total };
}

module.exports = ensureInteriorProjectsSeeded;
