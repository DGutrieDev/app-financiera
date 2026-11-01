import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerSuscripciones = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const suscripciones = await db.suscripcion.findMany({
      where: { usuarioId },
      include: { tarjeta: true },
      orderBy: { creadoEn: 'desc' },
    });
    return res.json(suscripciones);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener las suscripciones.' });
  }
};

export const crearSuscripcion = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    const { nombre, monto, diaCobro, tarjetaId } = req.body;

    if (!nombre || monto === undefined || !diaCobro) {
      return res.status(400).json({ error: 'El nombre, monto y día de cobro son obligatorios.' });
    }
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const suscripcion = await db.suscripcion.create({
      data: {
        nombre,
        monto: Number(monto),
        diaCobro: Number(diaCobro),
        tarjetaId: tarjetaId || null,
        usuarioId,
      },
    });

    return res.status(201).json(suscripcion);
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar la suscripción.' });
  }
};

export const actualizarSuscripcion = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usuarioId = req.usuario?.id || req.userId;
    const { nombre, monto, diaCobro, tarjetaId } = req.body;

    const actualizado = await db.suscripcion.update({
      where: { id, usuarioId },
      data: {
        nombre,
        monto: Number(monto),
        diaCobro: Number(diaCobro),
        tarjetaId: tarjetaId || null,
      },
    });

    return res.json(actualizado);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar la suscripción.' });
  }
};

export const eliminarSuscripcion = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usuarioId = req.usuario?.id || req.userId;

    await db.suscripcion.delete({ where: { id, usuarioId } });
    return res.json({ mensaje: 'Suscripción eliminada correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar la suscripción.' });
  }
};

// Alternar estado de pago del mes actual guardando el mes en pagadoMes y en pagos
export const togglePagoSuscripcion = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usuarioId = req.usuario?.id || req.userId;
    const mesActual = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const suscripcion = await db.suscripcion.findFirst({
      where: { id, usuarioId },
    });

    if (!suscripcion) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }

    const inicioMes = new Date(`${mesActual}-01T00:00:00.000Z`);
    const finMes = new Date(inicioMes);
    finMes.setMonth(finMes.getMonth() + 1);

    const pagoExistente = await db.pago.findFirst({
      where: {
        usuarioId,
        suscripcionId: id,
        creadoEn: {
          gte: inicioMes,
          lt: finMes,
        },
      },
    });

    if (pagoExistente) {
      // Si ya estaba pagada, eliminamos el pago, revertimos la deuda de tarjeta y limpiamos pagadoMes
      await db.$transaction(async (prisma) => {
        if (pagoExistente.tarjetaId) {
          await prisma.tarjeta.update({
            where: { id: pagoExistente.tarjetaId },
            data: { deudaActual: { decrement: pagoExistente.monto } },
          });
        }
        await prisma.pago.delete({ where: { id: pagoExistente.id } });

        await prisma.suscripcion.update({
          where: { id },
          data: { pagadoMes: null },
        });
      });

      return res.json({ pagado: false, mensaje: 'Suscripción marcada como pendiente.' });
    } else {
      // Si no estaba pagada, registramos el pago, aumentamos deuda de tarjeta y guardamos pagadoMes
      await db.$transaction(async (prisma) => {
        await prisma.pago.create({
          data: {
            concepto: `Pago de ${suscripcion.nombre}`,
            monto: suscripcion.monto,
            categoria: 'Suscripción',
            suscripcionId: suscripcion.id,
            tarjetaId: suscripcion.tarjetaId || null,
            usuarioId,
          },
        });

        if (suscripcion.tarjetaId) {
          await prisma.tarjeta.update({
            where: { id: suscripcion.tarjetaId },
            data: { deudaActual: { increment: suscripcion.monto } },
          });
        }

        await prisma.suscripcion.update({
          where: { id },
          data: { pagadoMes: mesActual },
        });
      });

      return res.json({ pagado: true, mensaje: 'Suscripción marcada como pagada.' });
    }
  } catch (error) {
    console.error('Error al alternar pago de suscripción:', error);
    return res.status(500).json({ error: 'Error al actualizar el estado de la suscripción.' });
  }
};