import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserListCount,
  createUser,
  updateProfile,
  deleteProfile,
  changePassword,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getUserConfig, updateUserConfig } from '../controllers/configController.js';

const router = express.Router();

// Ruta de prueba para verificar autenticación
router.get('/test-auth', protect, (req, res) => {
  res.json({ 
    message: 'Autenticación exitosa', 
    user: req.user 
  });
});

// Rutas exclusivas para el usuario autenticado (no requieren ser admin)
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteProfile);
router.put('/profile/password', protect, changePassword);

// Configuración de usuario (debe estar antes de authorize admin)
router.get('/config', protect, getUserConfig);
router.put('/config', protect, updateUserConfig);

// Proteger todas las rutas siguientes solo para admin
router.use(protect);
router.use(authorize(['admin']));

router.route('/')
  .get(getAllUsers) // Obtener todos los usuarios
  .post(createUser); // Añadir ruta para crear usuarios
router.route('/:id')
  .get(getUserById) // Obtener usuario por ID
  .put(updateUser) // Actualizar usuario por ID
  .delete(deleteUser); // Eliminar usuario por ID

router.get('/:id/lists/count', getUserListCount); // Obtener número de listas de un usuario

export default router;