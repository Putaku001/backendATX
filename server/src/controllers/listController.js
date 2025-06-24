import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Obtener todas las listas del usuario
export const getUserLists = async (req, res) => {
  try {
    const userId = req.user.id;
    const lists = await prisma.list.findMany({
      where: { user_id: userId },
      include: {
        animeLists: {
          include: {
            anime: true
          }
        }
      }
    });
    res.json(lists);
  } catch (error) {
    console.error('Error al obtener listas:', error);
    res.status(500).json({ message: 'Error al obtener las listas' });
  }
};

// Obtener una lista específica
export const getList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      },
      include: {
        animeLists: {
          include: {
            anime: true
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'Lista no encontrada' });
    }

    res.json(list);
  } catch (error) {
    console.error('Error al obtener lista:', error);
    res.status(500).json({ message: 'Error al obtener la lista' });
  }
};

// Crear una nueva lista
export const createList = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const list = await prisma.list.create({
      data: {
        title,
        description,
        user: {
          connect: { id: userId }
        }
      },
      include: {
        animeLists: {
          include: {
            anime: true
          }
        }
      }
    });

    res.status(201).json(list);
  } catch (error) {
    console.error('Error al crear lista:', error);
    res.status(500).json({ message: 'Error al crear la lista' });
  }
};

// Actualizar una lista
export const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'Lista no encontrada' });
    }

    const updatedList = await prisma.list.update({
      where: { id: parseInt(id) },
      data: { title, description },
      include: {
        animeLists: {
          include: {
            anime: true
          }
        }
      }
    });

    res.json(updatedList);
  } catch (error) {
    console.error('Error al actualizar lista:', error);
    res.status(500).json({ message: 'Error al actualizar la lista' });
  }
};

// Eliminar una lista
export const deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'Lista no encontrada' });
    }

    await prisma.list.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Lista eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar lista:', error);
    res.status(500).json({ message: 'Error al eliminar la lista' });
  }
};

// Agregar anime a una lista
export const addAnimeToList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { animeId } = req.body;
    const userId = req.user.id;

    // Verificar que la lista pertenece al usuario
    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(listId),
        user_id: userId
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'Lista no encontrada' });
    }

    // Verificar que el anime existe
    const anime = await prisma.anime.findUnique({
      where: { id: parseInt(animeId) }
    });

    if (!anime) {
      return res.status(404).json({ message: 'Anime no encontrado' });
    }

    // Agregar anime a la lista
    const animeList = await prisma.animeList.create({
      data: {
        list: {
          connect: { id: parseInt(listId) }
        },
        anime: {
          connect: { id: parseInt(animeId) }
        }
      },
      include: {
        anime: true
      }
    });

    res.status(201).json(animeList);
  } catch (error) {
    console.error('Error al agregar anime a la lista:', error);
    res.status(500).json({ message: 'Error al agregar anime a la lista' });
  }
};

// Eliminar anime de una lista
export const removeAnimeFromList = async (req, res) => {
  try {
    const { listId, animeId } = req.params;
    const userId = req.user.id;

    // Verificar que la lista pertenece al usuario
    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(listId),
        user_id: userId
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'Lista no encontrada' });
    }

    // Eliminar anime de la lista
    await prisma.animeList.deleteMany({
      where: {
        list_id: parseInt(listId),
        anime_id: parseInt(animeId)
      }
    });

    // Eliminar el anime del top del usuario SOLO si se elimina de la lista
    await prisma.topAnime.deleteMany({
      where: {
        user_id: userId,
        anime_id: parseInt(animeId)
      }
    });

    res.json({ message: 'Anime eliminado de la lista y del top exitosamente' });
  } catch (error) {
    console.error('Error al eliminar anime de la lista:', error);
    res.status(500).json({ message: 'Error al eliminar anime de la lista' });
  }
};

// Marcar o desmarcar una lista como Top
export const toggleTopList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'Lista no encontrada' });
    }

    // Solo activar el top, nunca desactivarlo automáticamente
    if (list.isTop) {
      // Ya está activado, no hacer nada
      return res.json(list);
    }

    const updatedList = await prisma.list.update({
      where: { id: parseInt(id) },
      data: { isTop: true }
    });

    res.json(updatedList);
  } catch (error) {
    console.error('Error al actualizar isTop:', error);
    res.status(500).json({ message: 'Error al actualizar el estado Top de la lista' });
  }
};

export const updateTopAnimes = async (req, res) => {
  try {
    const { listId } = req.params;
    const { topAnimeIds } = req.body;
    const userId = req.user.id;

    // Verificar que la lista existe y pertenece al usuario
    const list = await prisma.list.findFirst({
      where: { id: parseInt(listId), user_id: userId },
      include: { animeLists: { include: { anime: true } } }
    });

    if (!list) {
      return res.status(404).json({ message: 'Lista no encontrada' });
    }

    // Actualizar el orden de los animes en el top
    const updatedList = await prisma.list.update({
      where: { id: parseInt(listId) },
      data: { topAnimeIds },
      include: { animeLists: { include: { anime: true } } }
    });

    res.json(updatedList);
  } catch (error) {
    console.error('Error al actualizar top animes:', error);
    res.status(500).json({ message: 'Error al actualizar el top de animes' });
  }
}; 