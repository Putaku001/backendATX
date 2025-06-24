import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUserLists,
  getList,
  createList,
  updateList,
  deleteList,
  addAnimeToList,
  removeAnimeFromList,
  toggleTopList,
  updateTopAnimes
} from '../controllers/listController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas principales de listas
router.get('/', getUserLists);
router.get('/:id', getList);
router.post('/', createList);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

// Rutas para manejar animes en las listas
router.post('/:listId/anime', addAnimeToList);
router.delete('/:listId/anime/:animeId', removeAnimeFromList);

// Ruta para marcar/desmarcar una lista como Top
router.patch('/:id/top', toggleTopList);

// Ruta para actualizar el orden de los animes en el top
router.put('/:listId/top-animes', updateTopAnimes);

export default router; 