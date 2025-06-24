import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createMusic,
  getMusic,
  updateMusic,
  deleteMusic,
  rateMusic,
  getMusicRatings
} from '../controllers/musicController.js';

const router = express.Router();

router.get('/', getMusic); // Listar OP/ED
router.post('/', protect, createMusic); // Crear OP/ED
router.put('/:id', protect, updateMusic); // Editar OP/ED
router.delete('/:id', protect, deleteMusic); // Eliminar OP/ED
router.post('/:id/rate', protect, rateMusic); // Calificar OP/ED
router.get('/:id/ratings', getMusicRatings); // Obtener calificaciones de OP/ED

export default router; 