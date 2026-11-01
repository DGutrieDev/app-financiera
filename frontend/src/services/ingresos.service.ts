import { api } from '@/lib/api';

export const ingresosService = {
  obtenerIngresos: async () => {
    const { data } = await api.get('/ingresos');
    return data;
  },
  crearIngreso: async (ingreso: { nombre: string; monto: number; frecuencia: string }) => {
    const { data } = await api.post('/ingresos', ingreso);
    return data;
  },
  actualizarIngreso: async (
    id: string,
    ingreso: { nombre: string; monto: number; frecuencia: string }
  ) => {
    const { data } = await api.put(`/ingresos/${id}`, ingreso);
    return data;
  },
  eliminarIngreso: async (id: string) => {
    const { data } = await api.delete(`/ingresos/${id}`);
    return data;
  },
};