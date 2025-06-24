import { prisma } from '../config/db.js';

// Obtener el top de animes de un usuario
export const getUserTopAnimes = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario no proporcionado' });
    }
    const topAnimes = await prisma.topAnime.findMany({
      where: { user_id: userId },
      include: { anime: true },
      orderBy: { position: 'asc' }
    });
    return res.json(topAnimes);
  } catch (error) {
    console.error("Error en getUserTopAnimes:", error);
    return res.status(500).json({ message: 'Error al obtener el top de animes', error: error.message });
  }
};

// Agregar un anime al top
export const addAnimeToTop = async (req, res) => {
  try {
    const userId = req.user.id;
    const { animeId, position } = req.body;
    if (!userId || !animeId || position === undefined) {
      return res.status(400).json({ message: 'Datos incompletos para agregar al top' });
    }
    const anime = await prisma.anime.findUnique({ where: { id: parseInt(animeId) } });
    if (!anime) {
      return res.status(404).json({ message: 'Anime no encontrado' });
    }
    // Evitar duplicados
    const alreadyInTop = await prisma.topAnime.findFirst({ where: { user_id: userId, anime_id: parseInt(animeId) } });
    if (alreadyInTop) {
      return res.status(409).json({ message: 'El anime ya está en el top' });
    }
    // Ajustar posiciones si es necesario
    await prisma.topAnime.updateMany({
      where: { user_id: userId, position: { gte: parseInt(position) } },
      data: { position: { increment: 1 } }
    });
    const newTopAnime = await prisma.topAnime.create({
      data: {
        user_id: userId,
        anime_id: parseInt(animeId),
        position: parseInt(position)
      },
      include: { anime: true }
    });
    return res.status(201).json(newTopAnime);
  } catch (error) {
    console.error("Error en addAnimeToTop:", error);
    return res.status(500).json({ message: 'Error al agregar anime al top', error: error.message });
  }
};

// Actualizar la posición de un anime en el top
export const updateAnimePosition = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topAnimeId } = req.params;
    const { newPosition } = req.body;
    if (!userId || !topAnimeId || newPosition === undefined) {
      return res.status(400).json({ message: 'Datos incompletos para actualizar posición' });
    }
    const topAnime = await prisma.topAnime.findFirst({ where: { id: parseInt(topAnimeId), user_id: userId } });
    if (!topAnime) {
      return res.status(404).json({ message: 'Top anime no encontrado' });
    }
    if (topAnime.position === parseInt(newPosition)) {
      return res.json(topAnime);
    }
    // 1. Poner posición temporal para evitar conflicto
    await prisma.topAnime.update({
      where: { id: parseInt(topAnimeId) },
      data: { position: -1 }
    });
    // 2. Reordenar los demás
    if (topAnime.position < parseInt(newPosition)) {
      await prisma.topAnime.updateMany({
        where: {
          user_id: userId,
          position: { gt: topAnime.position, lte: parseInt(newPosition) }
        },
        data: { position: { decrement: 1 } }
      });
    } else {
      await prisma.topAnime.updateMany({
        where: {
          user_id: userId,
          position: { gte: parseInt(newPosition), lt: topAnime.position }
        },
        data: { position: { increment: 1 } }
      });
    }
    // 3. Asignar la nueva posición al registro movido
    const updatedTopAnime = await prisma.topAnime.update({
      where: { id: parseInt(topAnimeId) },
      data: { position: parseInt(newPosition) },
      include: { anime: true }
    });
    return res.json(updatedTopAnime);
  } catch (error) {
    console.error("Error en updateAnimePosition:", error);
    return res.status(500).json({ message: 'Error al actualizar la posición del anime', error: error.message });
  }
};

// Eliminar un anime del top
export const removeAnimeFromTop = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topAnimeId } = req.params;
    if (!userId || !topAnimeId) {
      return res.status(400).json({ message: 'Datos incompletos para eliminar del top' });
    }
    const topAnime = await prisma.topAnime.findFirst({ where: { id: parseInt(topAnimeId), user_id: userId } });
    if (!topAnime) {
      return res.status(404).json({ message: 'Top anime no encontrado' });
    }
    await prisma.topAnime.delete({ where: { id: parseInt(topAnimeId) } });
    // Reordenar posiciones
    await prisma.topAnime.updateMany({
      where: { user_id: userId, position: { gt: topAnime.position } },
      data: { position: { decrement: 1 } }
    });
    return res.json({ message: 'Anime eliminado del top exitosamente' });
  } catch (error) {
    console.error("Error en removeAnimeFromTop:", error);
    return res.status(500).json({ message: 'Error al eliminar anime del top', error: error.message });
  }
}; 