import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const obtenerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || req.userId;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { nombre: true, apellido: true, pais: true, correo: true },
    });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // 1. Manejo estricto del filtro por mes (ej. ?mes=2026-10)
    const { mes } = req.query;
    const mesRegex = /^\d{4}-\d{2}$/;
    const mesSeleccionado =
      typeof mes === 'string' && mesRegex.test(mes)
        ? mes
        : new Date().toISOString().slice(0, 7);

    // Definir los límites exactos del mes (Primer y último día del mes)
    const inicioMes = new Date(`${mesSeleccionado}-01T00:00:00.000Z`);
    const finMes = new Date(inicioMes);
    finMes.setMonth(finMes.getMonth() + 1);

    // 2. Obtener todos los registros del usuario en paralelo
    const [ingresos, suscripciones, gastos, tarjetas, pagos] = await Promise.all([
      db.ingreso.findMany({ where: { usuarioId } }),
      db.suscripcion.findMany({ where: { usuarioId } }),
      db.gasto.findMany({ where: { usuarioId } }),
      db.tarjeta.findMany({ where: { usuarioId } }),
      db.pago.findMany({ where: { usuarioId } }),
    ]);

    // 3. Filtrar estrictamente los movimientos que ocurrieron dentro de las fechas del mes seleccionado
    const ingresosDelMes = ingresos.filter((i) => i.creadoEn >= inicioMes && i.creadoEn < finMes);
    const pagosDelMes = pagos.filter((p) => p.creadoEn >= inicioMes && p.creadoEn < finMes);
    const gastosDelMes = gastos.filter((g) => g.creadoEn >= inicioMes && g.creadoEn < finMes);

    // Identificar las IDs de las suscripciones que ya tienen un pago este mes
    const idsSuscripcionesPagadas = new Set(
      pagosDelMes.map((p) => p.suscripcionId).filter(Boolean)
    );

    // Sumar solo las suscripciones efectivamente pagadas este mes
    const totalGastosFijosPagados = suscripciones
      .filter((sub) => idsSuscripcionesPagadas.has(sub.id))
      .reduce((acc, curr) => acc + curr.monto, 0);

    const totalIngresos = ingresosDelMes.reduce((acc, curr) => acc + curr.monto, 0);
    const totalGastosVariables = gastosDelMes.reduce((acc, curr) => acc + curr.monto, 0);
    const totalDeudaTarjetas = tarjetas.reduce((acc, curr) => acc + (curr.deudaActual || 0), 0);

    // Pagos independientes (que NO vienen de una suscripción)
    const totalPagosManuales = pagosDelMes
      .filter((p) => !p.suscripcionId)
      .reduce((acc, curr) => acc + curr.monto, 0);

    const totalGastosFijosProyectado = suscripciones.reduce((acc, curr) => acc + curr.monto, 0);

    // Balance neto del mes seleccionado
    const balanceNeto =
      totalIngresos - totalGastosFijosPagados - totalGastosVariables - totalPagosManuales;

    // ==========================================
    // 4. SECCIÓN DE GRÁFICOS Y TENDENCIAS
    // ==========================================

    const distribucionGastos = [
      { categoria: 'Gastos Fijos (Pagados)', monto: totalGastosFijosPagados },
      { categoria: 'Gastos Variables', monto: totalGastosVariables },
      { categoria: 'Otros Pagos', monto: totalPagosManuales },
    ].filter((item) => item.monto > 0);

    // Histórico de los últimos 6 meses para la evolución
    const evolucionMensual = [];
    const fechaActualRef = new Date(inicioMes);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(fechaActualRef);
      d.setMonth(d.getMonth() - i);
      const anioMesStr = d.toISOString().slice(0, 7);

      const inicioIt = new Date(`${anioMesStr}-01T00:00:00.000Z`);
      const finIt = new Date(inicioIt);
      finIt.setMonth(finIt.getMonth() + 1);


      const ingresosIt = ingresos.filter((i) => i.creadoEn >= inicioIt && i.creadoEn < finIt);
      const pagosIt = pagos.filter((p) => p.creadoEn >= inicioIt && p.creadoEn < finIt);
      const gastosIt = gastos.filter((g) => g.creadoEn >= inicioIt && g.creadoEn < finIt);

      const sumIngresosIt = ingresosIt.reduce((acc, curr) => acc + curr.monto, 0);
      const sumPagosIt = pagosIt.reduce((acc, curr) => acc + curr.monto, 0);
      const sumGastosIt = gastosIt.reduce((acc, curr) => acc + curr.monto, 0);

      const nombreMes = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      evolucionMensual.push({
        mes: anioMesStr,
        nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
        ingresos: sumIngresosIt,
        gastosTotales: sumPagosIt + sumGastosIt,
      });
    }

    // Gastos variables agrupados por categoría en el mes
    const categoriasGastosMap: { [key: string]: number } = {};
    gastosDelMes.forEach((g) => {
      const cat = g.categoria || 'General';
      categoriasGastosMap[cat] = (categoriasGastosMap[cat] || 0) + g.monto;
    });

    const gastosPorCategoria = Object.keys(categoriasGastosMap).map((cat) => ({
      categoria: cat,
      monto: categoriasGastosMap[cat],
    }));

    return res.json({
      usuario,
      filtroMes: mesSeleccionado,
      resumen: {
        totalIngresos,
        totalGastosFijos: totalGastosFijosPagados,
        totalGastosFijosProyectado,
        totalGastosVariables,
        totalDeudaTarjetas,
        totalPagos: pagosDelMes.reduce((acc, curr) => acc + curr.monto, 0),
        balanceNeto,
      },
      graficos: {
        distribucionGastos,
        evolucionMensual,
        gastosPorCategoria,
      },
    });
  } catch (error) {
    console.error('Error al obtener el dashboard:', error);
    return res.status(500).json({ error: 'Error al obtener la información del dashboard.' });
  }
};