const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O nome é obrigatório.' });
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? 'ADMIN' : 'USER';

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
    res.status(201).json({ token: generateToken(user.id) });
  } catch (error) {
    res.status(400).json({ error: 'Email já existe.' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({ token: generateToken(user.id) });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas.' });
  }
};

exports.getMe = async (req, res) => {
  const { id, name, email, role } = req.user;
  res.status(200).json({ id, name, email, role });
};