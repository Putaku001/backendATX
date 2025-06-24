import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Importar bcrypt para hashear contraseñas

const prisma = new PrismaClient();

// Obtener todos los usuarios con paginación
export const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Página actual, por defecto 1
  const limit = parseInt(req.query.limit) || 10; // Límite por página, por defecto 10
  const skip = (page - 1) * limit;

  try {
    const users = await prisma.user.findMany({
      skip: skip,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        _count: {
          select: {
            lists: true,
          },
        },
      },
      orderBy: {
        id: 'asc', // Ordenar por ID para paginación consistente
      },
    });

    const totalUsers = await prisma.user.count(); // Obtener el total de usuarios

    res.status(200).json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener el usuario.' });
  }
};

// Actualizar un usuario por ID
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body; // No permitiremos cambiar la contraseña directamente aquí por seguridad

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        username,
        email,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el usuario.' });
  }
};

// Eliminar un usuario por ID
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar el usuario.' });
  }
};

// Obtener el número de listas de un usuario (ya incluido en getAllUsers y getUserById, pero se puede hacer explícitamente si se necesita)
export const getUserListCount = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json({ listCount: user._count.lists });
  } catch (error) {
    console.error('Error al obtener el número de listas del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener el número de listas.' });
  }
};

// Crear un nuevo usuario (solo para administradores, o si se desea una ruta de registro para admins)
export const createUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Por favor, ingresa todos los campos requeridos: nombre de usuario, correo electrónico y contraseña.' });
  }

  try {
    // Verificar si el usuario ya existe por email o username
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (userExists) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese correo electrónico o nombre de usuario.' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || 'user', // Asignar rol por defecto 'user' si no se especifica
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    res.status(201).json({ message: 'Usuario creado exitosamente.', user: newUser });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear el usuario.' });
  }
};

// Actualizar perfil del usuario (para el propio usuario)
export const updateProfile = async (req, res) => {
  console.log('req.user:', req.user);
  console.log('req.body:', req.body);
  
  // Verificar que req.user existe y tiene un ID
  if (!req.user || !req.user.id) {
    console.error('Usuario no autenticado o ID no disponible');
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }
  
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const { username, email, profile_img, background_img } = req.body;

  console.log('userId:', userId);
  console.log('Datos a actualizar:', { username, email, profile_img, background_img });

  try {
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log('Usuario existente:', existingUser);

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar si el nuevo username o email ya existe (si se está cambiando)
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      if (usernameExists) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese nombre de usuario.' });
      }
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese correo electrónico.' });
      }
    }

    // Actualizar el perfil
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username || existingUser.username,
        email: email || existingUser.email,
        profile_img: profile_img !== undefined ? profile_img : existingUser.profile_img,
        background_img: background_img !== undefined ? background_img : existingUser.background_img,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        profile_img: true,
        background_img: true,
        created_at: true,
      },
    });

    console.log('Usuario actualizado:', updatedUser);

    res.status(200).json({
      message: 'Perfil actualizado exitosamente.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el perfil.' });
  }
};

// Eliminar el perfil del usuario autenticado
export const deleteProfile = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar el perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar el perfil.' });
  }
};

// Cambiar contraseña del usuario autenticado
export const changePassword = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Debes ingresar la contraseña actual y la nueva.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });
    res.status(200).json({ message: 'Contraseña cambiada exitosamente.' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
  }
}; 