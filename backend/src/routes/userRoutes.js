const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminOnly');

// Apenas admins logados podem acessar esta rota
router.route('/').get(protect, adminOnly, getUsers);

module.exports = router;