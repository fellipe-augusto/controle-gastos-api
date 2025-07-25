const express = require('express');
const router = express.Router();
const { 
  createExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense, 
  getResponsibles 
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminOnly');

router.route('/')
  .post(protect, adminOnly, createExpense)
  .get(protect, getExpenses);

router.route('/responsibles')
  .get(protect, getResponsibles);

router.route('/:id')
  .put(protect, adminOnly, updateExpense)
  .delete(protect, adminOnly, deleteExpense);

module.exports = router;