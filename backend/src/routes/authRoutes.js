const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Precisamos do 'protect' aqui

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // <-- ADICIONE ESTA LINHA

module.exports = router;