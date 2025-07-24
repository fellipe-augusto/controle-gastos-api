const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createCard = async (req, res) => {
  const { name, bank } = req.body;
  try {
    const card = await prisma.card.create({
      data: { name, bank, userId: req.user.id },
    });
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível criar o cartão.' });
  }
};

exports.getCards = async (req, res) => {
  try {
    // LÓGICA DE PERMISSÃO
    if (req.user.role === 'ADMIN') {
      // Se for ADMIN, busca todos os cartões
      const cards = await prisma.card.findMany(); 
      res.json(cards);
    } else {
      // Se for USER, a lógica é mais complexa:
      // 1. Encontre todas as despesas do usuário
      const userExpenses = await prisma.expense.findMany({
        where: { responsible: req.user.name },
        select: { cardId: true }, // Pega apenas o ID do cartão
        distinct: ['cardId'],    // Pega apenas IDs únicos
      });

      // 2. Extrai os IDs dos cartões para um array
      const cardIds = userExpenses.map(expense => expense.cardId);

      // 3. Busca apenas os cartões que correspondem a esses IDs
      const cards = await prisma.card.findMany({
        where: {
          id: {
            in: cardIds,
          },
        },
      });
      res.json(cards);
    }
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível buscar os cartões.' });
  }
};

exports.deleteCard = async (req, res) => {
  const { id } = req.params; // Pega o ID do cartão da URL
  const userId = req.user.id;

  try {
    // Verifica se o cartão existe e pertence ao usuário logado
    const card = await prisma.card.findFirst({
      where: { id, userId },
    });

    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado ou não autorizado.' });
    }

    // Pro-tip: Futuramente, adicionar uma verificação se o cartão possui despesas antes de excluir.
    await prisma.card.delete({
      where: { id },
    });
    
    res.status(200).json({ message: 'Cartão excluído com sucesso.' });
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível excluir o cartão.' });
  }
};