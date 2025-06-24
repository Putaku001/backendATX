import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUserTopAnimes,
  addAnimeToTop,
  updateAnimePosition,
  removeAnimeFromTop
} from '../controllers/topAnimeController.js';

const router = express.Router();

// Endpoint de prueba sin autenticación
router.get('/test', (req, res) => {
  console.log('¡/api/top-animes/test fue llamado!');
  res.json({ message: '¡El endpoint de prueba funciona!' });
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener el top de animes del usuario
router.get('/', getUserTopAnimes);

// Agregar un anime al top
router.post('/', addAnimeToTop);

// Actualizar la posición de un anime en el top
router.put('/:topAnimeId/position', updateAnimePosition);

// Eliminar un anime del top
router.delete('/:topAnimeId', removeAnimeFromTop);

export default router; 