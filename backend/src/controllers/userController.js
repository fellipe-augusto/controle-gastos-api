const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Listar todos os usuários (apenas para Admins)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
  try {
    // Selecionamos apenas os campos necessários para não expor dados sensíveis como a senha
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar a lista de usuários.' });
  }
};