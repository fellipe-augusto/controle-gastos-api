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
    if (req.user.role === 'ADMIN') {
      const cards = await prisma.card.findMany();
      res.json(cards);
    } else {
      const userExpenses = await prisma.expense.findMany({
        where: { responsible: req.user.name },
        select: { cardId: true },
        distinct: ['cardId'],
      });

      const cardIds = userExpenses.map(expense => expense.cardId);

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
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const card = await prisma.card.findFirst({
      where: { id, userId },
    });

    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado ou não autorizado.' });
    }

    await prisma.card.delete({
      where: { id },
    });
    
    res.status(200).json({ message: 'Cartão excluído com sucesso.' });
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível excluir o cartão.' });
  }
};