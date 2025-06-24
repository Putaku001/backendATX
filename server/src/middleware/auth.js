import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('AUTH MIDDLEWARE - Authorization header:', authHeader);
  if (!token) {
    console.log('AUTH MIDDLEWARE - Token no proporcionado');
    return res.status(401).json({ message: 'Token de autenticación no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('AUTH MIDDLEWARE - Token decodificado:', decoded);
    if (!decoded.id) {
      console.log('AUTH MIDDLEWARE - Token inválido: ID de usuario no encontrado');
      return res.status(401).json({ message: 'Token inválido: ID de usuario no encontrado' });
    }
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.error('AUTH MIDDLEWARE - Error al verificar token:', error);
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    next();
  };
}; 