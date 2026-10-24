import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.userId!;

    // 1. Datos del usuario
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { nombre: true, apellido: true, pais: true, correo: true },
    });

    // 2. Ingresos
    const ingresos = await db.ingreso.findMany({ where: { usuarioId } });
    const totalIngresos = ingresos.reduce((acc, item) => acc + Number(item.monto), 0);

    // 3. Gastos Fijos (Suscripciones)
    const suscripcionesActivas = await db.suscripcion.findMany({
      where: { usuarioId, estaActiva: true },
    });
    const totalGastosFijos = suscripcionesActivas.reduce((acc, item) => acc + Number(item.monto), 0);

    // 4. Gastos Variables del Mes
    const fechaActual = new Date();
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1);

    const gastosMes = await db.gasto.findMany({
      where: {
        usuarioId,
        fecha: { gte: primerDiaMes, lt: ultimoDiaMes },
      },
    });
    const totalGastosVariables = gastosMes.reduce((acc, item) => acc + Number(item.monto), 0);

    // 5. Deuda Total en Tarjetas
    const tarjetas = await db.tarjetaCredito.findMany({ where: { usuarioId } });
    const totalDeudaTarjetas = tarjetas.reduce((acc, item) => acc + Number(item.montoAdeudado), 0);

    // 6. Balance Disponible
    const balanceNeto = totalIngresos - (totalGastosFijos + totalGastosVariables);

    return res.json({
      usuario,
      resumen: {
        totalIngresos,
        totalGastosFijos,
        totalGastosVariables,
        totalDeudaTarjetas,
        balanceNeto,
      },
      detalles: {
        ingresos,
        suscripcionesActivas,
        gastosMes,
        tarjetas,
      },
    });
  } catch (error) {
    console.error('Error obteniendo el dashboard:', error);
    return res.status(500).json({ error: 'Error al obtener las métricas del dashboard.' });
  }
};