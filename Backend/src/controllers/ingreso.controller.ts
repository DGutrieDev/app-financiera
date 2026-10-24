import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerIngresos = async (req: AuthRequest, res: Response) => {
  try {
    const ingresos = await db.ingreso.findMany({
      where: { usuarioId: req.userId },
      orderBy: { creadoEn: 'desc' },
    });
    return res.json(ingresos);
  } catch (error) {
    console.error('Error obteniendo ingresos:', error);
    return res.status(500).json({ error: 'Error al obtener los ingresos.' });
  }
};

export const crearIngreso = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, monto, frecuencia } = req.body;

    if (!nombre || monto === undefined || !frecuencia) {
      return res.status(400).json({ error: 'Nombre, monto y frecuencia son obligatorios.' });
    }

    const ingreso = await db.ingreso.create({
      data: {
        nombre,
        monto: Number(monto),
        frecuencia,
        usuarioId: req.userId!,
      },
    });

    return res.status(201).json(ingreso);
  } catch (error) {
    console.error('Error creando ingreso:', error);
    return res.status(500).json({ error: 'Error al registrar el ingreso.' });
  }
};