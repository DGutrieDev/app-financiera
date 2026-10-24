import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerTarjetas = async (req: AuthRequest, res: Response) => {
  try {
    const tarjetas = await db.tarjetaCredito.findMany({
      where: { usuarioId: req.userId },
      orderBy: { creadoEn: 'desc' },
    });
    return res.json(tarjetas);
  } catch (error) {
    console.error('Error obteniendo tarjetas:', error);
    return res.status(500).json({ error: 'Error al obtener las tarjetas.' });
  }
};

export const crearTarjeta = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, montoAdeudado, fechaCorte, fechaPago } = req.body;

    if (!nombre || !fechaPago) {
      return res.status(400).json({ error: 'Nombre y fecha de pago son obligatorios.' });
    }

    const tarjeta = await db.tarjetaCredito.create({
      data: {
        nombre,
        montoAdeudado: montoAdeudado !== undefined ? Number(montoAdeudado) : 0,
        fechaCorte: fechaCorte ? new Date(fechaCorte) : null,
        fechaPago: new Date(fechaPago),
        usuarioId: req.userId!,
      },
    });

    return res.status(201).json(tarjeta);
  } catch (error) {
    console.error('Error creando tarjeta:', error);
    return res.status(500).json({ error: 'Error al registrar la tarjeta.' });
  }
};