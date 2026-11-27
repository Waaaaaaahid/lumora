// backend/api/index.js
// Vercel serverless entry — the whole Express app runs as one function.
const app = require('../server');
const connectDB = require('../config/db');
const ensureInteriorProjectsSeeded = require('../scripts/ensureInteriorProjectsSeeded');

let dbReady = null;
let interiorPortfolioReady = null;

module.exports = async (req, res) => {
  try {
    if (!dbReady) {
      dbReady = connectDB().catch((error) => {
        // Let a later request retry after a failed initial connection.
        dbReady = null;
        throw error;
      });
    }
    await dbReady;

    // Ensure the four interior projects exist in the same MongoDB collection
    // used by both the public Our Work page and the admin dashboard.
    if (!interiorPortfolioReady) {
      interiorPortfolioReady = ensureInteriorProjectsSeeded().catch((error) => {
        interiorPortfolioReady = null;
        throw error;
      });
    }
    await interiorPortfolioReady;

    return app(req, res);
  } catch (error) {
    console.error('Backend startup error:', error);

    return res.status(500).json({
      success: false,
      message: 'Backend failed to start',
      // Keep internal exception details in server logs, never expose them publicly.
    });
  }
};
