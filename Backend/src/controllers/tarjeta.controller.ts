import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerTarjetas = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const tarjetas = await db.tarjeta.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
    });
    return res.json(tarjetas);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener las tarjetas.' });
  }
};

export const crearTarjeta = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    const { nombre, limite, deudaActual, diaPago } = req.body;

    if (!nombre || diaPago === undefined) {
      return res.status(400).json({ error: 'El nombre y el día de pago son obligatorios.' });
    }
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const tarjeta = await db.tarjeta.create({
      data: {
        nombre,
        limite: limite !== undefined ? Number(limite) : 0,
        deudaActual: deudaActual !== undefined ? Number(deudaActual) : 0,
        diaPago: Number(diaPago),
        usuarioId,
      },
    });

    return res.status(201).json(tarjeta);
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar la tarjeta.' });
  }
};

export const actualizarTarjeta = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id || req.userId;
    const tarjetaId = Array.isArray(id) ? id[0] : id;
    const { nombre, limite, deudaActual, diaPago } = req.body;

    const actualizada = await db.tarjeta.update({
      where: { id: tarjetaId, usuarioId },
      data: {
        nombre,
        limite: limite !== undefined ? Number(limite) : undefined,
        deudaActual: deudaActual !== undefined ? Number(deudaActual) : undefined,
        diaPago: diaPago !== undefined ? Number(diaPago) : undefined,
      },
    });

    return res.json(actualizada);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar la tarjeta.' });
  }
};

export const eliminarTarjeta = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id || req.userId;
    const tarjetaId = Array.isArray(id) ? id[0] : id;

    if (!tarjetaId || !usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    await db.tarjeta.delete({ where: { id: tarjetaId, usuarioId } });
    return res.json({ mensaje: 'Tarjeta eliminada correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar la tarjeta.' });
  }
};