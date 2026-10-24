import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

// Registro de Usuario
export const registrar = async (req: Request, res: Response) => {
  try {
    const { correo, password, nombre, apellido, pais } = req.body;

    if (!correo || !password || !nombre || !apellido || !pais) {
      return res.status(400).json({ 
        error: 'Todos los campos (correo, password, nombre, apellido, país) son obligatorios.' 
      });
    }

    const usuarioExistente = await db.usuario.findUnique({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await db.usuario.create({
      data: {
        correo,
        passwordHash,
        nombre,
        apellido,
        pais,
      },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        pais: true,
        creadoEn: true,
      },
    });

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente.',
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Inicio de Sesión
export const login = async (req: Request, res: Response) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    const usuario = await db.usuario.findUnique({ where: { correo } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const esPasswordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!esPasswordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign({ userId: usuario.id }, secret, { expiresIn: '7d' });

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        pais: usuario.pais,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};