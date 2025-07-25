const express = require('express');
const router = express.Router();
const { createCard, getCards, deleteCard } = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminOnly');

router.route('/').get(protect, getCards);

router.route('/').post(protect, adminOnly, createCard);
router.route('/:id').delete(protect, adminOnly, deleteCard);

module.exports = router;