const { PrismaClient } = require('@prisma/client');
const { addMonths, startOfMonth, endOfMonth } = require('date-fns');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

exports.createExpense = async (req, res) => {
  const { date, description, amount, totalInstallments = 1, cardId, responsible } = req.body;
  const userId = req.user.id;

  if (!responsible) {
    return res.status(400).json({ error: 'O responsável pela despesa é obrigatório.' });
  }

  try {
    const card = await prisma.card.findFirst({ where: { id: cardId, userId: userId } });
    if (!card) {
      return res.status(404).json({ error: "Cartão não encontrado ou não pertence ao usuário." });
    }

    const purchaseId = randomUUID();
    const purchaseDate = new Date(date);
    const expenseAmount = parseFloat(amount) / totalInstallments;

    for (let i = 1; i <= totalInstallments; i++) {
      const installmentDescription = description;
      const dueDate = addMonths(purchaseDate, i - 1);

      await prisma.expense.create({
        data: {
          description: installmentDescription,
          amount: expenseAmount,
          date: purchaseDate,
          dueDate: dueDate,
          installment: i,
          totalInstallments: parseInt(totalInstallments),
          responsible: responsible,
          cardId: cardId,
          purchaseId: purchaseId,
        },
      });
    }
    res.status(201).json({ message: 'Despesa criada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Não foi possível criar a despesa.' });
  }
};

exports.getExpenses = async (req, res) => {
  const { year, month, cardId, responsible } = req.query;
  const loggedInUser = req.user;

  if (!year || !month) {
    return res.status(400).json({ error: 'Ano e mês são obrigatórios.' });
  }

  const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
  const endDate = endOfMonth(startDate);

  const whereClause = {
    dueDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (cardId) {
    whereClause.cardId = cardId;
  }
  
  if (loggedInUser.role === 'ADMIN') {
    if (responsible) {
      whereClause.responsible = responsible;
    }
  } else {
    whereClause.responsible = loggedInUser.name;
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        card: true
      },
      orderBy: { dueDate: 'asc' },
    });
    res.json(expenses);
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível buscar as despesas.' });
  }
};

exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const { description, amount, date, responsible } = req.body;
  
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada.' });
    }
    
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: { description, amount, date: new Date(date), responsible },
    });
    
    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível atualizar a despesa.' });
  }
};

exports.deleteExpense = async (req, res) => {
  const { id } = req.params;
  
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada.' });
    }
    
    await prisma.expense.deleteMany({
      where: {
        purchaseId: expense.purchaseId,
      },
    });
    
    res.status(200).json({ message: 'Despesa e suas parcelas foram excluídas com sucesso.' });
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível excluir a despesa.' });
  }
};

exports.getResponsibles = async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const responsibles = await prisma.expense.findMany({
        select: {
          responsible: true,
        },
        distinct: ['responsible'],
      });
      res.json(responsibles.map(r => r.responsible));
    } else {
      res.json([req.user.name]);
    }
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível buscar a lista de responsáveis.'});
  }
};