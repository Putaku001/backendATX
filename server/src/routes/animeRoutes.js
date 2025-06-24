import express from 'express';
import { getAllAnimes, getAnimeById, createAnime, updateAnime, deleteAnime, getAnimeSeasons, createSeason, rateEpisode, getSeasonById, updateSeason, deleteSeason } from '../controllers/animeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de animes
router.get('/', getAllAnimes);
router.get('/:id', protect, getAnimeById);
router.post('/', createAnime);
router.put('/:id', updateAnime);
router.delete('/:id', deleteAnime);

// Rutas de temporadas
router.get('/:id/seasons', getAnimeSeasons);
router.post('/:id/seasons', protect, createSeason);
router.get('/seasons/:id', getSeasonById);
router.put('/seasons/:id', protect, updateSeason);
router.delete('/seasons/:id', protect, deleteSeason);

// Ruta para calificar episodios
router.post('/episodes/:id/rate', protect, rateEpisode);

export default router; 