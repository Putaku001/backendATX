import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const protect = async (req, res, next) => {
  let token;

  console.log('Headers de autorización:', req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extraído:', token);

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);

      // Adjuntar usuario a la solicitud
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, email: true, role: true },
      });

      console.log('Usuario encontrado:', req.user);

      next();
    } catch (error) {
      console.error('Error en el middleware de protección:', error);
      res.status(401).json({ message: 'No autorizado, token fallido.' });
    }
  }

  if (!token) {
    console.log('No se encontró token');
    res.status(401).json({ message: 'No autorizado, no hay token.' });
  }
};

export const authorize = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado, no tiene el rol necesario.' });
  }
  next();
}; 