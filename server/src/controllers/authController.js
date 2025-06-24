import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendMail } from '../utils/emailService.js';
import crypto from 'crypto';
import resetPasswordEmail from '../templates/resetPasswordEmail.js';

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Verificar si el usuario ya existe
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return res.status(400).json({
        error: 'El email ya está registrado.'
      });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return res.status(400).json({
        error: 'El nombre de usuario ya está registrado.'
      });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        profile_img: true,
        background_img: true,
        created_at: true,
      }
    });

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente', 
      user: newUser 
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ 
      error: 'Error al registrar usuario', 
      details: err.message 
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    // Comparar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    // Generar JWT
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_img: user.profile_img,
        background_img: user.background_img,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión', details: err.message });
  }
};

// Generar Token JWT
const generateToken = (id) => {
  // ... existing code ...
};

// Manejador para solicitar restablecimiento de contraseña
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Por favor, ingrese su correo electrónico.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'No existe un usuario con ese correo electrónico.' });
    }

    // Generar un token de 6 dígitos (numérico)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Establecer la fecha de expiración a 10 minutos desde ahora
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); 

    // Guardar el token hasheado y la fecha de expiración en la base de datos
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpire: resetPasswordExpire,
      },
    });

    const resetURL = `Su código de restablecimiento de contraseña es: ${resetToken}`;

    // Asegurarse de que el correo electrónico del usuario no esté vacío antes de enviar
    if (!user.email) {
      console.error('Error: El correo electrónico del usuario es nulo o indefinido.', user);
      return res.status(500).json({ message: 'Error al enviar el correo de restablecimiento: el correo electrónico del destinatario no es válido.' });
    }

    try {
      await sendMail({
        to: user.email,
        subject: 'Restablecimiento de contraseña de AnimeTrackerX',
        html: resetPasswordEmail(user.username, resetToken),
      });

      res.status(200).json({ message: 'Correo de restablecimiento de contraseña enviado.' });
    } catch (mailError) {
      // Si falla el envío del correo, limpiar el token en la base de datos para evitar bloqueos
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpire: null,
        },
      });
      console.error('Error al enviar correo de restablecimiento:', mailError);
      return res.status(500).json({ message: 'Error al enviar el correo de restablecimiento de contraseña. Por favor, inténtalo de nuevo más tarde.' });
    }
  } catch (error) {
    console.error('Error en la solicitud de restablecimiento de contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Manejador para verificar el código de restablecimiento de contraseña
export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Por favor, ingrese el correo electrónico y el código.' });
  }

  try {
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetPasswordToken: hashedCode,
        resetPasswordExpire: { gt: new Date() }, // El token no debe haber expirado
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Código de restablecimiento inválido o expirado.' });
    }

    res.status(200).json({ message: 'Código verificado exitosamente.' });
  } catch (error) {
    console.error('Error al verificar el código:', error);
    res.status(500).json({ message: 'Error interno del servidor al verificar el código.' });
  }
};

// Manejador para restablecer la contraseña
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Por favor, ingrese el correo electrónico, el código y la nueva contraseña.' });
  }

  try {
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetPasswordToken: hashedCode,
        resetPasswordExpire: { gt: new Date() }, // El token no debe haber expirado
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Código de restablecimiento inválido o expirado.' });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null, // Limpiar el token después de usarlo
        resetPasswordExpire: null, // Limpiar la expiración
      },
    });

    res.status(200).json({ message: 'Contraseña restablecida exitosamente.' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor al restablecer la contraseña.' });
  }
}; 