import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerGastos = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const gastos = await db.gasto.findMany({
      where: { usuarioId },
      include: { tarjeta: true },
      orderBy: { creadoEn: 'desc' },
    });
    return res.json(gastos);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los gastos.' });
  }
};

export const crearGasto = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    const { concepto, monto, categoria, tarjetaId } = req.body;

    if (!concepto || monto === undefined) {
      return res.status(400).json({ error: 'El concepto y el monto son obligatorios.' });
    }
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const resultado = await db.$transaction(async (prisma) => {
      const gasto = await prisma.gasto.create({
        data: {
          concepto,
          monto: Number(monto),
          categoria: categoria || 'General',
          tarjetaId: tarjetaId || null,
          usuarioId,
        },
      });

      if (tarjetaId) {
        await prisma.tarjeta.update({
          where: { id: tarjetaId },
          data: { deudaActual: { increment: Number(monto) } },
        });
      }

      return gasto;
    });

    return res.status(201).json(resultado);
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar el gasto.' });
  }
};

export const actualizarGasto = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usuarioId = req.usuario?.id || req.userId;
    const { concepto, monto, categoria, tarjetaId } = req.body;

    const gastoAnterior = await db.gasto.findFirst({ where: { id, usuarioId } });
    if (!gastoAnterior) return res.status(404).json({ error: 'Gasto no encontrado.' });

    const resultado = await db.$transaction(async (prisma) => {
      // Revertir deuda anterior si tenía tarjeta
      if (gastoAnterior.tarjetaId) {
        await prisma.tarjeta.update({
          where: { id: gastoAnterior.tarjetaId },
          data: { deudaActual: { decrement: gastoAnterior.monto } },
        });
      }

      // Aplicar nueva deuda si tiene tarjeta
      if (tarjetaId) {
        await prisma.tarjeta.update({
          where: { id: tarjetaId },
          data: { deudaActual: { increment: Number(monto) } },
        });
      }

      return await prisma.gasto.update({
        where: { id },
        data: {
          concepto,
          monto: Number(monto),
          categoria: categoria || 'General',
          tarjetaId: tarjetaId || null,
        },
      });
    });

    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el gasto.' });
  }
};

export const eliminarGasto = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usuarioId = req.usuario?.id || req.userId;

    const gasto = await db.gasto.findFirst({ where: { id, usuarioId } });
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado.' });

    await db.$transaction(async (prisma) => {
      if (gasto.tarjetaId) {
        await prisma.tarjeta.update({
          where: { id: gasto.tarjetaId },
          data: { deudaActual: { decrement: gasto.monto } },
        });
      }
      await prisma.gasto.delete({ where: { id } });
    });

    return res.json({ mensaje: 'Gasto eliminado correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar el gasto.' });
  }
};