const express = require('express');
const router = express.Router();
const { createCard, getCards, deleteCard } = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminOnly'); // Importe o novo middleware

// Rota de leitura (GET)
router.route('/').get(protect, getCards);

// Rotas de escrita (POST, DELETE)
router.route('/').post(protect, adminOnly, createCard);
router.route('/:id').delete(protect, adminOnly, deleteCard);

module.exports = router;