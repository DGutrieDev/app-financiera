import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerGastos = async (req: AuthRequest, res: Response) => {
  try {
    const gastos = await db.gasto.findMany({
      where: { usuarioId: req.userId },
      include: { tarjetaCredito: true },
      orderBy: { fecha: 'desc' },
    });
    return res.json(gastos);
  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    return res.status(500).json({ error: 'Error al obtener los gastos.' });
  }
};

export const crearGasto = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, monto, categoria, fecha, tarjetaCreditoId } = req.body;

    if (!nombre || monto === undefined) {
      return res.status(400).json({ error: 'El nombre y el monto son obligatorios.' });
    }

    // Transacción: Si tiene tarjetaCreditoId, actualiza el monto adeudado
    const resultado = await db.$transaction(async (prisma) => {
      const gasto = await prisma.gasto.create({
        data: {
          nombre,
          monto: Number(monto),
          categoria: categoria || 'General',
          fecha: fecha ? new Date(fecha) : new Date(),
          tarjetaCreditoId: tarjetaCreditoId || null, // Opcional (efectivo/salario si es nulo)
          usuarioId: req.userId!,
        },
      });

      if (tarjetaCreditoId) {
        await prisma.tarjetaCredito.update({
          where: { id: tarjetaCreditoId },
          data: {
            montoAdeudado: {
              increment: Number(monto),
            },
          },
        });
      }

      return gasto;
    });

    return res.status(201).json(resultado);
  } catch (error) {
    console.error('Error al crear gasto:', error);
    return res.status(500).json({ error: 'Error al registrar el gasto.' });
  }
};