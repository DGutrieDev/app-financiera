import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerIngresos = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const ingresos = await db.ingreso.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
    });
    return res.json(ingresos);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los ingresos.' });
  }
};

export const crearIngreso = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    const { nombre, monto, frecuencia } = req.body;

    if (!nombre || monto === undefined) {
      return res.status(400).json({ error: 'El nombre y el monto son obligatorios.' });
    }
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const frecuenciaFinal = frecuencia || 'Mensual';

    // Validar que si es Mensual, no exista ya otro ingreso mensual registrado
    if (frecuenciaFinal === 'Mensual') {
      const ingresoMensualExistente = await db.ingreso.findFirst({
        where: { usuarioId, frecuencia: 'Mensual' },
      });

      if (ingresoMensualExistente) {
        return res.status(400).json({
          error: 'Ya tienes un ingreso registrado como Mensual. Regístralo con otra frecuencia (ej. Quincenal, Único o Anual).',
        });
      }
    }

    const ingreso = await db.ingreso.create({
      data: {
        nombre,
        monto: Number(monto),
        frecuencia: frecuenciaFinal,
        usuarioId,
      },
    });

    return res.status(201).json(ingreso);
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar el ingreso.' });
  }
};

export const actualizarIngreso = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usuarioId = req.usuario?.id || req.userId;
    const { nombre, monto, frecuencia } = req.body;

    // Si se actualiza a frecuencia Mensual, validar que no pertenezca a otro registro distinto
    if (frecuencia === 'Mensual') {
      const ingresoMensualExistente = await db.ingreso.findFirst({
        where: {
          usuarioId,
          frecuencia: 'Mensual',
          NOT: { id },
        },
      });

      if (ingresoMensualExistente) {
        return res.status(400).json({
          error: 'Ya existe otro ingreso registrado con frecuencia Mensual.',
        });
      }
    }

    const actualizado = await db.ingreso.update({
      where: { id, usuarioId },
      data: {
        nombre,
        monto: Number(monto),
        frecuencia,
      },
    });

    return res.json(actualizado);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el ingreso.' });
  }
};

export const eliminarIngreso = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usuarioId = req.usuario?.id || req.userId;

    await db.ingreso.delete({ where: { id, usuarioId } });
    return res.json({ mensaje: 'Ingreso eliminado correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar el ingreso.' });
  }
};