import { api } from '@/lib/api';

export const gastosService = {
  obtenerGastos: async () => {
    const { data } = await api.get('/gastos');
    return data;
  },
  crearGasto: async (gasto: { concepto: string; monto: number; categoria?: string }) => {
    const { data } = await api.post('/gastos', gasto);
    return data;
  },
  actualizarGasto: async (id: string, gasto: { concepto: string; monto: number; categoria?: string }) => {
    const { data } = await api.put(`/gastos/${id}`, gasto);
    return data;
  },
  eliminarGasto: async (id: string) => {
    const { data } = await api.delete(`/gastos/${id}`);
    return data;
  },
};