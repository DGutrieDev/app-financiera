import { api } from '@/lib/api';

export const suscripcionesService = {
  obtenerSuscripciones: async () => {
    const { data } = await api.get('/suscripciones');
    return data;
  },
  crearSuscripcion: async (suscripcion: {
    nombre: string;
    monto: number;
    diaCobro: number;
    tarjetaId?: string | null;
  }) => {
    const { data } = await api.post('/suscripciones', suscripcion);
    return data;
  },
  actualizarSuscripcion: async (
    id: string,
    suscripcion: {
      nombre: string;
      monto: number;
      diaCobro: number;
      tarjetaId?: string | null;
    }
  ) => {
    const { data } = await api.put(`/suscripciones/${id}`, suscripcion);
    return data;
  },
  eliminarSuscripcion: async (id: string) => {
    const { data } = await api.delete(`/suscripciones/${id}`);
    return data;
  },
};