import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { getIncomes, createIncome } from '../controllers/ingreso.controller';
import { getCards, createCard } from '../controllers/tarjeta.controller';
import { getSubscriptions, createSubscription, toggleSubscriptionStatus } from '../controllers/suscripcion.controller';
import { getExpenses, createExpense } from '../controllers/gasto.controller';
import { getDashboardMetrics } from '../controllers/dashboard.controller';

const router = Router();

// Todas las rutas financieras exigen autenticación por seguridad
router.use(verifyJWT);

// Dashboard
router.get('/dashboard', getDashboardMetrics);

// Ingresos
router.get('/incomes', getIncomes);
router.post('/incomes', createIncome);

// Tarjetas de Crédito
router.get('/cards', getCards);
router.post('/cards', createCard);

// Suscripciones
router.get('/subscriptions', getSubscriptions);
router.post('/subscriptions', createSubscription);
router.patch('/subscriptions/:id/toggle', toggleSubscriptionStatus);

// Otros Gastos
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);

export default router;