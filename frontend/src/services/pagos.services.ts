import { api } from '@/lib/api';

export const pagosService = {
  obtenerPagos: async () => {
    const { data } = await api.get('/payments');
    return data;
  },
  crearPago: async (pago: {
    concepto: string;
    monto: number;
    categoria?: string;
    tarjetaId?: string | null;
    suscripcionId?: string | null;
  }) => {
    const { data } = await api.post('/payments', pago);
    return data;
  },
  eliminarPago: async (id: string) => {
    const { data } = await api.delete(`/payments/${id}`);
    return data;
  }
};