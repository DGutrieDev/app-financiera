import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../config/database';

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await db.expense.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      include: { creditCard: true },
    });
    return res.json(expenses);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los gastos.' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { name, amount, date, category, creditCardId } = req.body;

    if (!name || amount === undefined) {
      return res.status(400).json({ error: 'Nombre y monto son obligatorios.' });
    }

    // Usamos una transacción por si el gasto se carga a una tarjeta de crédito
    // y necesitamos actualizar automáticamente su monto adeudado (amountOwed).
    const result = await db.$transaction(async (prisma) => {
      const expense = await prisma.expense.create({
        data: {
          name,
          amount,
          date: date ? new Date(date) : new Date(),
          category: category || 'General',
          creditCardId: creditCardId || null,
          userId: req.userId!,
        },
      });

      // Si se indicó una tarjeta, sumamos el monto al adeudo actual de la tarjeta
      if (creditCardId) {
        await prisma.creditCard.update({
          where: { id: creditCardId },
          data: {
            amountOwed: {
              increment: Number(amount),
            },
          },
        });
      }

      return expense;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creando gasto:', error);
    return res.status(500).json({ error: 'Error al registrar el gasto.' });
  }
};