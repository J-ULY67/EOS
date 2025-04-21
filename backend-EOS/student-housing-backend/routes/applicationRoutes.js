const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Student routes
router.post('/', authMiddleware.authenticate, applicationController.submitApplication);
router.get('/my-application', authMiddleware.authenticate, applicationController.getUserApplication);

// Admin routes
router.get('/', authMiddleware.authenticate, authMiddleware.adminOnly, applicationController.getAllApplications);
router.put('/:id', authMiddleware.authenticate, authMiddleware.adminOnly, applicationController.updateApplicationStatus);
router.delete('/:id', authMiddleware.authenticate, authMiddleware.adminOnly, applicationController.deleteApplication);

module.exports = router;