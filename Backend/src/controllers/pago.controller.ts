import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerPagos = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const pagos = await db.pago.findMany({
      where: { usuarioId },
      include: { tarjeta: true, suscripcion: true },
      orderBy: { creadoEn: 'desc' },
    });
    return res.json(pagos);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los pagos.' });
  }
};

export const crearPago = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    const { concepto, monto, categoria, tarjetaId, suscripcionId } = req.body;

    if (!concepto || monto === undefined) {
      return res.status(400).json({ error: 'El concepto y el monto son obligatorios.' });
    }
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const mesActual = new Date().toISOString().slice(0, 7);

    const resultado = await db.$transaction(async (prisma) => {
      const pago = await prisma.pago.create({
        data: {
          concepto,
          monto: Number(monto),
          categoria: categoria || 'General',
          tarjetaId: tarjetaId || null,
          suscripcionId: suscripcionId || null,
          usuarioId,
        },
      });

      if (tarjetaId) {
        await prisma.tarjeta.update({
          where: { id: tarjetaId },
          data: { deudaActual: { decrement: Number(monto) } },
        });
      }

      if (suscripcionId) {
        await prisma.suscripcion.update({
          where: { id: suscripcionId },
          data: { pagadoMes: mesActual },
        });
      }

      return pago;
    });

    return res.status(201).json(resultado);
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar el pago.' });
  }
};

export const eliminarPago = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id || req.userId;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Identificador de pago inválido.' });
    }

    const pago = await db.pago.findFirst({ where: { id, usuarioId } });
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });

    await db.$transaction(async (prisma) => {
      // Si el pago afectó una tarjeta, revertimos el decremento (sumamos de vuelta la deuda)
      if (pago.tarjetaId) {
        await prisma.tarjeta.update({
          where: { id: pago.tarjetaId },
          data: { deudaActual: { increment: pago.monto } },
        });
      }
      await prisma.pago.delete({ where: { id } });
    });

    return res.json({ mensaje: 'Pago eliminado correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar el pago.' });
  }
};