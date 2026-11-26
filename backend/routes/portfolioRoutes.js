const express = require('express');
const router = express.Router();
const controller = require('../controllers/portfolioController');
const { buildUploader, buildVideoUploader, isCloudinaryConfigured } = require('../services/uploadService');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', controller.listProjects);
router.get('/admin', protect, admin, controller.listAdminProjects);
router.post('/upload', protect, admin, (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Image storage is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to your backend hosting environment.',
    });
  }
  return buildUploader('lumora/portfolio').single('image')(req, res, next);
}, controller.uploadImage);
router.post('/upload-video', protect, admin, (req, res, next) => {
  if (!isCloudinaryConfigured()) return res.status(503).json({ success: false, message: 'Video storage is not configured. Add Cloudinary credentials to backend hosting.' });
  return buildVideoUploader('lumora/portfolio/videos').single('video')(req, res, next);
}, controller.uploadImage);
router.post('/', protect, admin, controller.createProject);
router.put('/:id', protect, admin, controller.updateProject);
router.delete('/:id', protect, admin, controller.deleteProject);

module.exports = router;
