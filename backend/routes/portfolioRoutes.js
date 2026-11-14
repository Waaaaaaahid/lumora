const express = require('express');
const router = express.Router();
const controller = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', controller.listProjects);
router.get('/admin', protect, admin, controller.listAdminProjects);
router.post('/', protect, admin, controller.createProject);
router.put('/:id', protect, admin, controller.updateProject);
router.delete('/:id', protect, admin, controller.deleteProject);

module.exports = router;
