import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Obtener la configuración del usuario autenticado
export const getUserConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    let config = await prisma.config.findUnique({ where: { user_id: userId } });
    // Si no existe, crear con valores por defecto
    if (!config) {
      config = await prisma.config.create({ data: { user_id: userId } });
    }
    res.json(config);
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    res.status(500).json({ message: 'Error al obtener la configuración' });
  }
};

// Actualizar la configuración del usuario autenticado
export const updateUserConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mostrarListas, mantenerTopAbierto, minimizarSiempre, calificarOpEd, mostrarCorreo } = req.body;
    let config = await prisma.config.findUnique({ where: { user_id: userId } });
    if (!config) {
      config = await prisma.config.create({ 
        data: { 
          user_id: userId, 
          mostrarListas, 
          mantenerTopAbierto, 
          minimizarSiempre, 
          calificarOpEd,
          mostrarCorreo
        } 
      });
    } else {
      config = await prisma.config.update({
        where: { user_id: userId },
        data: { 
          mostrarListas, 
          mantenerTopAbierto, 
          minimizarSiempre, 
          calificarOpEd,
          mostrarCorreo
        }
      });
    }
    res.json(config);
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    res.status(500).json({ message: 'Error al actualizar la configuración' });
  }
}; 