import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { crearIngreso, obtenerIngresos, actualizarIngreso, eliminarIngreso } from '../controllers/ingreso.controller';
import { crearTarjeta, obtenerTarjetas, actualizarTarjeta, eliminarTarjeta } from '../controllers/tarjeta.controller';
import { crearSuscripcion, obtenerSuscripciones, actualizarSuscripcion, eliminarSuscripcion, togglePagoSuscripcion } from '../controllers/suscripcion.controller';
import { crearGasto, obtenerGastos, actualizarGasto, eliminarGasto } from '../controllers/gasto.controller';
import { obtenerDashboard } from '../controllers/dashboard.controller';
import { crearPago, obtenerPagos, eliminarPago } from '../controllers/pago.controller';

const router = Router();

// Todas las rutas financieras exigen autenticación por seguridad
router.use(verifyJWT);

// Dashboard
router.get('/dashboard', obtenerDashboard);

// Ingresos
router.get('/ingresos', obtenerIngresos);
router.post('/ingresos', crearIngreso);
router.put('/ingresos/:id', actualizarIngreso);
router.delete('/ingresos/:id', eliminarIngreso);

// Tarjetas de Crédito
router.get('/tarjetas', obtenerTarjetas);
router.post('/tarjetas', crearTarjeta);
router.put('/tarjetas/:id', actualizarTarjeta);
router.delete('/tarjetas/:id', eliminarTarjeta);

// Suscripciones
router.get('/suscripciones', obtenerSuscripciones);
router.post('/suscripciones', crearSuscripcion);
router.put('/suscripciones/:id', actualizarSuscripcion);
router.delete('/suscripciones/:id', eliminarSuscripcion);
router.patch('/suscripciones/:id/toggle', togglePagoSuscripcion);

// Gastos Variables
router.get('/gastos', obtenerGastos);
router.post('/gastos', crearGasto);
router.put('/gastos/:id', actualizarGasto);
router.delete('/gastos/:id', eliminarGasto);

// Pagos
router.get('/payments', obtenerPagos);
router.post('/payments', crearPago);
router.delete('/payments/:id', eliminarPago);

export default router;