const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/', roomController.getAllRooms);

// Admin routes
router.post('/', authMiddleware.authenticate, authMiddleware.adminOnly, roomController.createRoom);
router.delete('/:id', authMiddleware.authenticate, authMiddleware.adminOnly, roomController.deleteRoom);

module.exports = router;