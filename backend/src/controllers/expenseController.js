const { PrismaClient } = require('@prisma/client');
const { addMonths } = require('date-fns');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

exports.createExpense = async (req, res) => {
  const { date, description, amount, totalInstallments = 1, cardId, responsible } = req.body;
  const userId = req.user.id;

  if (!responsible) {
    return res.status(400).json({ error: 'O responsável pela despesa é obrigatório.' });
  }

  try {
    const card = await prisma.card.findFirst({ where: { id: cardId, userId: userId }});
    if (!card) {
      return res.status(404).json({ error: "Cartão não encontrado ou não pertence ao usuário."});
    }

    const purchaseId = randomUUID();
    const purchaseDate = new Date(date); // Armazena a data da compra
    const expenseAmount = parseFloat(amount) / totalInstallments;

    for (let i = 1; i <= totalInstallments; i++) {
      const installmentDescription = totalInstallments > 1 ? `${description} (${i}/${totalInstallments})` : description;
      
      // CALCULA A DATA DE COMPETÊNCIA DE CADA PARCELA
      const dueDate = addMonths(purchaseDate, i - 1);

      await prisma.expense.create({
        data: {
          description: installmentDescription,
          amount: expenseAmount,
          date: purchaseDate, // A data da compra original é a mesma para todas as parcelas
          dueDate: dueDate,  // A data de competência muda a cada mês
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

const { startOfMonth, endOfMonth, parseISO } = require('date-fns');

exports.getExpenses = async (req, res) => {
  const { year, month, cardId, responsible } = req.query;
  const loggedInUser = req.user; // Pega o usuário logado

  if (!year || !month) {
    return res.status(400).json({ error: 'Ano e mês são obrigatórios.'});
  }

  // Cria as datas de início e fim do mês solicitado
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
    // Se for ADMIN e um responsável foi selecionado no filtro, adicione ao 'where'
    if (responsible) {
      whereClause.responsible = responsible;
    }
  } else {
    // Se for USER, ignore o filtro 'responsible' e force a busca apenas pelo nome dele
    whereClause.responsible = loggedInUser.name;
  }

  try {
    const expenses = await prisma.expense.findMany({
      // 4. A cláusula 'where' agora é dinâmica e NÃO TEM MAIS O FILTRO DE USUÁRIO
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
    // Primeiro, verifica se a despesa pertence ao usuário logado
    const expense = await prisma.expense.findFirst({
      where: { id, card: { userId: req.user.id } },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada ou não autorizada.' });
    }
    
    // Atualiza a despesa
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
    const expense = await prisma.expense.findFirst({
      where: { id, card: { userId: req.user.id } },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada ou não autorizada.' });
    }
    
    // LÓGICA IMPORTANTE: Excluir todas as parcelas da mesma compra.
    await prisma.expense.deleteMany({
      where: {
        purchaseId: expense.purchaseId, // Usa o ID da compra para encontrar todas as parcelas
        card: { userId: req.user.id }, // Segurança extra
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
      // Se for ADMIN, busca todos os responsáveis únicos no banco
      const responsibles = await prisma.expense.findMany({
        select: {
          responsible: true,
        },
        distinct: ['responsible'],
      });
      res.json(responsibles.map(r => r.responsible));
    } else {
      // Se for USER, retorna apenas o próprio nome
      res.json([req.user.name]);
    }
  } catch (error) {
    res.status(400).json({ error: 'Não foi possível buscar a lista de responsáveis.'});
  }
};