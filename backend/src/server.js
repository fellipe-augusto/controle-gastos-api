require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const cardRoutes = require('./routes/cardRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// Configure o CORS de forma mais explícita
const corsOptions = {
  origin: 'https://app-controle-de-gastos-fellipe.vercel.app/', // Substitua pela URL da Vercel
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// =================================================================
// INÍCIO DO CÓDIGO DE DEBUG - "DEDO-DURO"
// Este middleware vai registrar toda requisição que chegar no servidor
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] Recebida requisição: ${req.method} ${req.originalUrl}`
  );
  next(); // Continua para a próxima rota
});
// FIM DO CÓDIGO DE DEBUG
// =================================================================

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/expenses', protect, expenseRoutes);
app.use('/api/cards', protect, cardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
