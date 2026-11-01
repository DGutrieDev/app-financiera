import { api } from '@/lib/api';

export const tarjetasService = {
  obtenerTarjetas: async () => {
    const { data } = await api.get('/tarjetas');
    return data;
  },
  crearTarjeta: async (tarjeta: { nombre: string; deudaActual: number; diaPago: number }) => {
    const { data } = await api.post('/tarjetas', tarjeta);
    return data;
  },
  actualizarTarjeta: async (
    id: string,
    tarjeta: { nombre: string; deudaActual: number; diaPago: number }
  ) => {
    const { data } = await api.put(`/tarjetas/${id}`, tarjeta);
    return data;
  },
  eliminarTarjeta: async (id: string) => {
    const { data } = await api.delete(`/tarjetas/${id}`);
    return data;
  },
};