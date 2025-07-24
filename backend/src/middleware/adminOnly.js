const adminOnly = (req, res, next) => {
  // Este middleware deve rodar DEPOIS do 'protect', então 'req.user' já existe
  if (req.user && req.user.role === 'ADMIN') {
    next(); // Se for admin, pode prosseguir
  } else {
    // Se não for admin, retorna erro 403: Acesso Proibido
    res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
  }
};

module.exports = { adminOnly };