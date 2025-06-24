import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Crear un nuevo OP/ED
export const createMusic = async (req, res) => {
  try {
    let { anime_id, season_id, type, name, link, image, start_episode, end_episode, order } = req.body;
    // Limpiar valores opcionales
    season_id = season_id === '' || season_id === undefined ? null : Number(season_id);
    start_episode = start_episode === '' || start_episode === undefined ? null : Number(start_episode);
    end_episode = end_episode === '' || end_episode === undefined ? null : Number(end_episode);
    order = order === '' || order === undefined ? null : Number(order);
    anime_id = Number(anime_id);
    const music = await prisma.music.create({
      data: { anime_id, season_id, type, name, link, image, start_episode, end_episode, order }
    });
    res.status(201).json(music);
  } catch (error) {
    console.error('Error al crear OP/ED:', error);
    res.status(500).json({ message: 'Error al crear OP/ED' });
  }
};

// Listar OP/ED de un anime (y opcionalmente de una temporada)
export const getMusic = async (req, res) => {
  try {
    const { animeId, seasonId } = req.query;
    const where = { anime_id: Number(animeId) };
    if (seasonId) where.season_id = Number(seasonId);
    const music = await prisma.music.findMany({
      where,
      orderBy: [{ order: 'asc' }, { start_episode: 'asc' }],
      include: {
        ratings: true
      }
    });
    // Agregar avgRating a cada OP/ED
    const musicWithAvg = music.map(m => {
      const ratings = m.ratings.map(r => r.rating).filter(r => typeof r === 'number');
      const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
      return { ...m, avgRating };
    });
    res.json(musicWithAvg);
  } catch (error) {
    console.error('Error al obtener OP/ED:', error);
    res.status(500).json({ message: 'Error al obtener OP/ED' });
  }
};

// Editar OP/ED
export const updateMusic = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, link, image, start_episode, end_episode, order } = req.body;
    const music = await prisma.music.update({
      where: { id: Number(id) },
      data: { type, name, link, image, start_episode, end_episode, order }
    });
    res.json(music);
  } catch (error) {
    console.error('Error al actualizar OP/ED:', error);
    res.status(500).json({ message: 'Error al actualizar OP/ED' });
  }
};

// Eliminar OP/ED
export const deleteMusic = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Backend: Eliminando OP/ED con id:', id);
    await prisma.music.delete({ where: { id: Number(id) } });
    res.json({ message: 'OP/ED eliminado' });
  } catch (error) {
    console.error('Error al eliminar OP/ED:', error);
    res.status(500).json({ message: 'Error al eliminar OP/ED' });
  }
};

// Calificar OP/ED
export const rateMusic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    // Si ya existe, actualizar; si no, crear
    const existing = await prisma.musicRating.findFirst({ where: { music_id: Number(id), user_id: userId } });
    let musicRating;
    if (existing) {
      musicRating = await prisma.musicRating.update({
        where: { id: existing.id },
        data: { rating, comment }
      });
    } else {
      musicRating = await prisma.musicRating.create({
        data: { music_id: Number(id), user_id: userId, rating, comment }
      });
    }
    res.json(musicRating);
  } catch (error) {
    console.error('Error al calificar OP/ED:', error);
    res.status(500).json({ message: 'Error al calificar OP/ED' });
  }
};

// Obtener calificaciones de un OP/ED
export const getMusicRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const ratings = await prisma.musicRating.findMany({
      where: { music_id: Number(id) },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(ratings);
  } catch (error) {
    console.error('Error al obtener calificaciones de OP/ED:', error);
    res.status(500).json({ message: 'Error al obtener calificaciones de OP/ED' });
  }
}; 