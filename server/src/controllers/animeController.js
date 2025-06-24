import prisma from '../prisma/client.js';

// Obtener todos los animes
export const getAllAnimes = async (req, res) => {
  try {
    const animes = await prisma.anime.findMany();
    res.status(200).json(animes);
  } catch (error) {
    console.error('Error al obtener animes:', error);
    res.status(500).json({ error: 'Error al obtener animes', details: error.message });
  }
};

// Obtener un anime por ID
export const getAnimeById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const anime = await prisma.anime.findUnique({
      where: { id: parseInt(id) },
      include: {
        seasons: {
          include: {
            episodes: {
              orderBy: { number: 'asc' },
              include: userId ? {
                episodeRatings: {
                  where: { user_id: userId },
                  select: { rating: true, comment: true }
                }
              } : undefined
            }
          },
          orderBy: { number: 'asc' }
        }
      }
    });
    if (!anime) {
      return res.status(404).json({ error: 'Anime no encontrado' });
    }
    // Mapear el rating personalizado al campo rating de cada episodio
    if (userId) {
      anime.seasons.forEach(season => {
        season.episodes.forEach(ep => {
          ep.rating = ep.episodeRatings?.[0]?.rating || null;
          ep.comment = ep.episodeRatings?.[0]?.comment || '';
          delete ep.episodeRatings;
        });
      });
    }
    res.status(200).json(anime);
  } catch (error) {
    console.error('Error al obtener anime por ID:', error);
    res.status(500).json({ error: 'Error al obtener anime', details: error.message });
  }
};

// Crear un nuevo anime
export const createAnime = async (req, res) => {
  const { title, description, cover_img, background_img, status, watch_links, episodesCount = 12, episodes } = req.body;
  try {
    // Crear el anime
    const newAnime = await prisma.anime.create({
      data: {
        title,
        description,
        cover_img,
        background_img,
        status,
        watch_links: watch_links || [],
        seasons: {
          create: [{
            number: 1,
            episodes: {
              create: Array.from({ length: episodesCount }, (_, i) => ({
                number: i + 1,
                title: episodes && episodes[i]?.title ? episodes[i].title : `Episodio ${i + 1}`
              }))
            }
          }]
        }
      },
      include: {
        seasons: {
          include: { episodes: true }
        }
      }
    });
    res.status(201).json(newAnime);
  } catch (error) {
    console.error('Error al crear anime:', error);
    res.status(500).json({ error: 'Error al crear anime', details: error.message });
  }
};

// Actualizar un anime
export const updateAnime = async (req, res) => {
  const { id } = req.params;
  const { title, description, cover_img, background_img, status, watch_links, episodes } = req.body;
  try {
    let season;
    if (episodes) {
      // Buscar la primera temporada del anime
      season = await prisma.season.findFirst({
        where: { animeId: parseInt(id), number: 1 },
        include: { episodes: { orderBy: { number: 'asc' } } }
      });
      if (!season) {
        // Si no existe, la creamos
        season = await prisma.season.create({
          data: {
            animeId: parseInt(id),
            number: 1
          }
        });
      }
      const currentEpisodes = season.episodes;
      const currentCount = currentEpisodes.length;
      const newCount = episodes.length;

      // 1. Actualizar títulos de los episodios existentes
      for (let i = 0; i < Math.min(currentCount, newCount); i++) {
        if (episodes[i].title !== currentEpisodes[i].title) {
          await prisma.episode.update({
            where: { id: currentEpisodes[i].id },
            data: { title: episodes[i].title }
          });
        }
      }
      // 2. Si hay más episodios nuevos, agregarlos
      if (newCount > currentCount) {
        const episodesToCreate = [];
        for (let i = currentCount; i < newCount; i++) {
          episodesToCreate.push({
            seasonId: season.id,
            title: episodes[i].title,
            number: i + 1
          });
        }
        if (episodesToCreate.length > 0) {
          await prisma.episode.createMany({ data: episodesToCreate });
        }
      }
      // 3. Si hay menos episodios, eliminar los sobrantes
      if (newCount < currentCount) {
        await prisma.episode.deleteMany({
          where: {
            seasonId: season.id,
            number: { gt: newCount }
          }
        });
      }
    }

    const updatedAnime = await prisma.anime.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        cover_img,
        background_img,
        status,
        watch_links: watch_links || []
      },
      include: {
        seasons: {
          include: { episodes: true }
        }
      }
    });
    res.status(200).json(updatedAnime);
  } catch (error) {
    console.error('Error al actualizar anime:', error);
    res.status(500).json({ error: 'Error al actualizar anime', details: error.message });
  }
};

// Eliminar un anime
export const deleteAnime = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.anime.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Anime eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar anime:', error);
    res.status(500).json({ error: 'Error al eliminar anime', details: error.message });
  }
};

// Obtener temporadas y episodios de un anime
export const getAnimeSeasons = async (req, res) => {
  const { id } = req.params;
  try {
    const seasons = await prisma.season.findMany({
      where: { animeId: parseInt(id) },
      orderBy: { number: 'asc' },
      include: { episodes: { orderBy: { number: 'asc' } } }
    });
    res.json(seasons);
  } catch (error) {
    console.error('Error al obtener temporadas:', error);
    res.status(500).json({ error: 'Error al obtener temporadas', details: error.message });
  }
};

// Crear una nueva temporada para un anime
export const createSeason = async (req, res) => {
  const { id } = req.params;
  const { episodesCount } = req.body;
  try {
    // Obtener el número de la nueva temporada
    const lastSeason = await prisma.season.findFirst({
      where: { animeId: parseInt(id) },
      orderBy: { number: 'desc' }
    });
    const newNumber = lastSeason ? lastSeason.number + 1 : 1;
    // Crear la temporada y los episodios vacíos
    const season = await prisma.season.create({
      data: {
        animeId: parseInt(id),
        number: newNumber,
        episodes: {
          create: Array.from({ length: episodesCount }, (_, i) => ({ number: i + 1, title: `Episodio ${i + 1}` }))
        }
      },
      include: { episodes: true }
    });
    res.status(201).json(season);
  } catch (error) {
    console.error('Error al crear temporada:', error);
    res.status(500).json({ error: 'Error al crear temporada', details: error.message });
  }
};

// Calificar un episodio
export const rateEpisode = async (req, res) => {
  const { id } = req.params; // id del episodio
  const { rating, comment } = req.body;
  const userId = req.user.id;

  // Log para depuración
  console.log('rateEpisode body:', req.body);

  try {
    // Buscar si ya existe un rating para este usuario y episodio
    const existing = await prisma.episodeRating.findFirst({
      where: {
        episode_id: parseInt(id),
        user_id: userId
      }
    });
    let result;
    if (existing) {
      result = await prisma.episodeRating.update({
        where: { id: existing.id },
        data: {
          rating: typeof rating === 'number' ? rating : existing.rating,
          comment: typeof comment === 'string' ? comment : existing.comment
        }
      });
      // Log resultado update
      console.log('rateEpisode update result:', result);
    } else {
      // Crear nuevo rating (requiere al menos rating, pero puede venir comment)
      result = await prisma.episodeRating.create({
        data: {
          episode_id: parseInt(id),
          user_id: userId,
          rating: typeof rating === 'number' ? rating : 0,
          comment: typeof comment === 'string' ? comment : ''
        }
      });
      // Log resultado create
      console.log('rateEpisode create result:', result);
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al calificar episodio:', error);
    res.status(500).json({ error: 'Error al calificar episodio', details: error.message });
  }
};

// Obtener una temporada específica
export const getSeasonById = async (req, res) => {
  const { id } = req.params;
  try {
    const season = await prisma.season.findUnique({
      where: { id: parseInt(id) },
      include: { episodes: { orderBy: { number: 'asc' } } }
    });
    if (!season) {
      return res.status(404).json({ error: 'Temporada no encontrada' });
    }
    res.status(200).json(season);
  } catch (error) {
    console.error('Error al obtener temporada:', error);
    res.status(500).json({ error: 'Error al obtener temporada', details: error.message });
  }
};

// Actualizar una temporada
export const updateSeason = async (req, res) => {
  const { id } = req.params;
  const { episodesCount, episodes } = req.body;
  try {
    // Obtener episodios actuales
    const currentEpisodes = await prisma.episode.findMany({
      where: { seasonId: parseInt(id) },
      orderBy: { number: 'asc' }
    });
    const currentCount = currentEpisodes.length;

    // Si se reduce el número de episodios, elimina los que sobran
    if (episodesCount < currentCount) {
      await prisma.episode.deleteMany({
        where: {
          seasonId: parseInt(id),
          number: { gt: episodesCount }
        }
      });
    }

    // Si se aumenta el número de episodios, crea los nuevos
    if (episodesCount > currentCount) {
      const episodesToCreate = [];
      for (let i = currentCount; i < episodesCount; i++) {
        const existingEp = episodes?.find(ep => ep.number === i + 1);
        episodesToCreate.push({
          number: i + 1,
          title: existingEp?.title || `Episodio ${i + 1}`
        });
      }
      await prisma.episode.createMany({
        data: episodesToCreate.map(ep => ({
          seasonId: parseInt(id),
          number: ep.number,
          title: ep.title
        }))
      });
    }

    // Actualiza los títulos de los episodios existentes si cambiaron
    for (let i = 0; i < Math.min(currentCount, episodesCount); i++) {
      const existingEp = episodes?.find(ep => ep.number === i + 1);
      if (existingEp && existingEp.title && existingEp.title !== currentEpisodes[i].title) {
        await prisma.episode.update({
          where: { id: currentEpisodes[i].id },
          data: { title: existingEp.title }
        });
      }
    }

    // Devuelve la temporada actualizada con episodios ordenados
    const updatedSeason = await prisma.season.findUnique({
      where: { id: parseInt(id) },
      include: { episodes: { orderBy: { number: 'asc' } } }
    });
    res.status(200).json(updatedSeason);
  } catch (error) {
    console.error('Error al actualizar temporada:', error);
    res.status(500).json({ error: 'Error al actualizar temporada', details: error.message });
  }
};

// Eliminar una temporada
export const deleteSeason = async (req, res) => {
  const { id } = req.params;
  try {
    // Primero eliminamos los episodios asociados
    await prisma.episode.deleteMany({
      where: { seasonId: parseInt(id) }
    });
    
    // Luego eliminamos la temporada
    await prisma.season.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({ message: 'Temporada eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar temporada:', error);
    res.status(500).json({ error: 'Error al eliminar temporada', details: error.message });
  }
}; 