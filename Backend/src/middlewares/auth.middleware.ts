import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  usuario?: {
    id: string;
    correo?: string;
  };
  userId?: string; // Mantenemos ambos por compatibilidad
}

export const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'secret_key';
    const decoded = jwt.verify(token, secret) as { userId?: string; id?: string };

    // Soportamos tanto si el token trae 'userId' como si trae 'id'
    const idUsuario = decoded.userId || decoded.id;

    if (!idUsuario) {
      return res.status(403).json({ error: 'Token inválido: no contiene un ID de usuario.' });
    }

    // Inyectamos el usuario para que funcione con req.usuario?.id y req.userId
    req.usuario = { id: idUsuario };
    req.userId = idUsuario;

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};