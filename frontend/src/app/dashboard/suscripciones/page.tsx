'use client';

import { useEffect, useState } from 'react';
import { suscripcionesService } from '@/services/suscripciones.service';
import { tarjetasService } from '@/services/tarjetas.service';
import { formatearMoneda } from '@/utils/formateadoresMoneda';
import Select, { type SelectOption } from '@/components/ui/Select';
import { api } from '@/lib/api';
import {
  Calendar,
  Plus,
  AlertCircle,
  CreditCard,
  Wallet,
  Hash,
  TrendingDown,
  Clock,
  Trash2,
  Edit3,
  X,
  Check,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface Suscripcion {
  id: string;
  nombre: string;
  monto: number;
  diaCobro: number;
  tarjetaId?: string;
  tarjeta?: { nombre: string };
  creadoEn: string;
}

// En móvil el texto va a 16px para evitar el zoom automático de iOS al enfocar
const campoClase =
  'w-full px-3 py-1.5 bg-white dark:bg-[#070b12] border border-slate-300 dark:border-white/10 rounded-lg text-base sm:text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/40 focus:border-cyan-600 dark:focus:border-cyan-500 transition-colors';

const labelClase = 'block text-[13px] font-medium text-slate-700 dark:text-gray-300 mb-1';

const ayudaClase = 'mt-1 text-xs text-slate-500 dark:text-gray-500';

// Superficie base: igual que el dashboard y el navbar flotante
const superficie =
  'bg-white dark:bg-[#0d1420] border border-slate-200 dark:border-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const tarjetaClase = `${superficie} rounded-xl transition-colors`;

// Chip de ícono neutro
const chipNeutro =
  'flex shrink-0 items-center justify-center bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400';

// "YYYY-MM" con la fecha local (toISOString usa UTC y puede cambiar de mes cerca de la medianoche)
const aClaveMes = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function SuscripcionesPage() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [pagosMes, setPagosMes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paisUsuario, setPaisUsuario] = useState('Costa Rica');

  // Mes actual manejado de forma segura en el cliente (evita errores de hidratación)
  const [mesActual, setMesActual] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    monto: '',
    diaCobro: '',
    tarjetaId: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const usuarioLocal = localStorage.getItem('usuario');
      if (usuarioLocal) {
        const parsed = JSON.parse(usuarioLocal);
        if (parsed.pais) setPaisUsuario(parsed.pais);
      }

      const [dataSubs, dataTarjetas, resPagos] = await Promise.all([
        suscripcionesService.obtenerSuscripciones(),
        tarjetasService.obtenerTarjetas(),
        api.get('/payments'),
      ]);

      setSuscripciones(dataSubs);
      setTarjetas(dataTarjetas);
      setPagosMes(resPagos.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las suscripciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMesActual(aClaveMes(new Date()));
    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    try {
      const payload = {
        nombre: form.nombre,
        monto: Number(form.monto),
        diaCobro: Number(form.diaCobro),
        tarjetaId: form.tarjetaId || null,
      };

      if (editandoId) {
        await suscripcionesService.actualizarSuscripcion(editandoId, payload);
      } else {
        await suscripcionesService.crearSuscripcion(payload);
      }

      setForm({ nombre: '', monto: '', diaCobro: '', tarjetaId: '' });
      setEditandoId(null);
      await cargarDatos();
    } catch (err: any) {
      setErrorForm(err.response?.data?.error || 'Error al guardar la suscripción.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (sub: Suscripcion) => {
    setEditandoId(sub.id);
    setForm({
      nombre: sub.nombre,
      monto: sub.monto.toString(),
      diaCobro: sub.diaCobro.toString(),
      tarjetaId: sub.tarjetaId || '',
    });
  };

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setForm({ nombre: '', monto: '', diaCobro: '', tarjetaId: '' });
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta suscripción?')) return;
    try {
      setEliminandoId(id);
      await suscripcionesService.eliminarSuscripcion(id);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar la suscripción.');
    } finally {
      setEliminandoId(null);
    }
  };

  // Validar si está pagada en el mes actual (YYYY-MM, hora local)
  const estaPagada = (suscripcionId: string) => {
    if (!mesActual) return false;
    return pagosMes.some((p: any) => {
      if (!p.suscripcionId || p.suscripcionId !== suscripcionId) return false;
      return aClaveMes(new Date(p.creadoEn)) === mesActual;
    });
  };

  const handleTogglePago = async (id: string) => {
    try {
      await api.patch(`/suscripciones/${id}/toggle`);
      await cargarDatos();
    } catch (err: any) {
      alert('Error al actualizar el estado de pago.');
    }
  };

  // Resumen calculado a partir de las suscripciones cargadas
  const totalSuscripciones = suscripciones.reduce((acc, item) => acc + Number(item.monto), 0);
  const promedio = suscripciones.length > 0 ? totalSuscripciones / suscripciones.length : 0;
  const ultimaSub =
    suscripciones.length > 0
      ? suscripciones.reduce((a, b) => (new Date(b.creadoEn) > new Date(a.creadoEn) ? b : a))
      : null;

  // Opciones de tarjeta para el select personalizado
  const opcionesTarjeta: SelectOption[] = [
    { value: '', label: 'Sin tarjeta asociada' },
    ...tarjetas.map((tar) => ({
      value: tar.id,
      label: tar.nombre,
      hint: `Deuda ${formatearMoneda(tar.deudaActual, paisUsuario)}`,
    })),
  ];

  // Color solo como punto pequeño, igual que en el dashboard
  const resumen = [
    {
      label: 'Total mensual',
      valor: formatearMoneda(totalSuscripciones, paisUsuario),
      icon: Wallet,
      punto: 'bg-cyan-500 dark:bg-cyan-400',
    },
    {
      label: 'Suscripciones',
      valor: String(suscripciones.length),
      icon: Hash,
      punto: 'bg-violet-500 dark:bg-violet-400',
    },
    {
      label: 'Promedio mensual',
      valor: formatearMoneda(promedio, paisUsuario),
      icon: TrendingDown,
      punto: 'bg-emerald-500 dark:bg-emerald-400',
    },
    {
      label: 'Última registrada',
      valor: ultimaSub ? formatearFecha(ultimaSub.creadoEn) : '—',
      icon: Clock,
      punto: 'bg-amber-500 dark:bg-amber-400',
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* Encabezado */}
      <header className="flex items-start gap-3 min-w-0">
        <span className={`${chipNeutro} h-9 w-9 rounded-lg`}>
          <Calendar size={20} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-gray-100">
            Gastos fijos y suscripciones
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">
            Administra tus servicios recurrentes y marca cuáles están pagados en el mes.
          </p>
        </div>
      </header>

      {/* Resumen */}
      <section aria-label="Resumen de suscripciones" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {resumen.map(({ label, valor, icon: Icon, punto }) => (
          <div
            key={label}
            className={`min-w-0 flex items-center gap-3 ${superficie} p-3 rounded-xl transition-colors`}
          >
            <span className={`${chipNeutro} hidden sm:flex h-9 w-9 rounded-lg`}>
              <Icon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-gray-400">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${punto}`} />
                <span className="truncate">{label}</span>
              </span>
              {loading ? (
                <div className="mt-1 h-6 w-24 rounded-md bg-slate-100 dark:bg-white/5 animate-pulse" />
              ) : (
                <p className="mt-0.5 text-lg font-semibold leading-tight tabular-nums break-words text-slate-900 dark:text-gray-100">
                  {valor}
                </p>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)] gap-3">
        {/* Formulario */}
        <section className={`${tarjetaClase} p-4`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
              <span className={`${chipNeutro} h-7 w-7 rounded-lg`}>
                {editandoId ? <Edit3 size={15} /> : <Plus size={15} />}
              </span>
              {editandoId ? 'Editar suscripción' : 'Nueva suscripción'}
            </h2>
            {editandoId && (
              <button
                type="button"
                onClick={handleCancelarEdicion}
                className="text-xs text-rose-500 flex items-center gap-1 hover:underline"
              >
                <X size={14} /> Cancelar
              </button>
            )}
          </div>
          <p className="text-[13px] text-slate-500 dark:text-gray-400 mb-3">
            {editandoId ? 'Modifica los datos de la suscripción.' : 'Completa los datos del servicio.'}
          </p>

          {errorForm && (
            <div
              role="alert"
              className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 rounded-lg text-sm flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorForm}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label htmlFor="nombre" className={labelClase}>
                Nombre del servicio
              </label>
              <input
                id="nombre"
                type="text"
                required
                placeholder="Ej. Netflix, Gimnasio, Alquiler..."
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="monto" className={labelClase}>
                Monto mensual
              </label>
              <input
                id="monto"
                type="number"
                inputMode="decimal"
                step="any"
                required
                placeholder="0.00"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="diaCobro" className={labelClase}>
                Día de cobro
              </label>
              <input
                id="diaCobro"
                type="number"
                min="1"
                max="31"
                required
                placeholder="Ej. 10"
                value={form.diaCobro}
                onChange={(e) => setForm({ ...form, diaCobro: e.target.value })}
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="tarjeta" className={labelClase}>
                Asociar tarjeta <span className="font-normal text-slate-400 dark:text-gray-500">(opcional)</span>
              </label>
              <Select
                id="tarjeta"
                value={form.tarjetaId}
                onChange={(valor) => setForm({ ...form, tarjetaId: valor })}
                options={opcionesTarjeta}
                acento="cyan"
              />
              <p className={ayudaClase}>Tarjeta de crédito asociada al cobro.</p>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2 mt-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0d1420]"
            >
              {guardando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : editandoId ? (
                <>
                  <Check size={18} />
                  Guardar cambios
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Guardar suscripción
                </>
              )}
            </button>
          </form>
        </section>

        {/* Listado */}
        <section className={`${tarjetaClase} relative min-w-0 overflow-hidden`}>
          <div className="flex h-full flex-col lg:absolute lg:inset-0">
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100">
                Suscripciones activas
              </h2>
              {!loading && !error && suscripciones.length > 0 && (
                <span className="rounded-md bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-gray-400">
                  {suscripciones.length} {suscripciones.length === 1 ? 'registro' : 'registros'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-4 space-y-2 animate-pulse" aria-label="Cargando suscripciones">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-white/5 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="p-4">
                <div
                  role="alert"
                  className="p-4 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 rounded-lg text-sm"
                >
                  {error}
                </div>
              </div>
            ) : suscripciones.length === 0 ? (
              <div className="flex-1 py-8 px-6 text-center text-slate-500 dark:text-gray-500 flex flex-col items-center justify-center gap-2">
                <span className={`${chipNeutro} h-10 w-10 rounded-full`}>
                  <Calendar size={20} />
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  No tienes suscripciones registradas
                </p>
                <p className="text-sm">Usa el formulario para registrar la primera.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:flex shrink-0 items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-gray-500">
                  <span className="flex-1 pl-10">Servicio / Cobro</span>
                  <span className="w-28 text-center">Estado del mes</span>
                  <span className="w-28 text-right">Monto</span>
                  <span className="w-20 text-center">Acciones</span>
                </div>

                <div className="relative flex-1 min-h-0 flex flex-col">
                  <ul className="flex-1 min-h-0 max-h-[20rem] lg:max-h-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden divide-y divide-slate-200 dark:divide-white/10">
                    {suscripciones.map((item) => {
                      const pagada = estaPagada(item.id);
                      return (
                        <li
                          key={item.id}
                          className="flex items-start sm:items-center gap-3 px-4 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                        >
                          <span className={`${chipNeutro} h-7 w-7 rounded-lg`}>
                            <Calendar size={16} />
                          </span>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm break-words">
                              {item.nombre}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-slate-500 dark:text-gray-400">
                              <span>Cobro el día {item.diaCobro}</span>
                              {item.tarjeta && (
                                <span className="flex items-center gap-1">
                                  <CreditCard size={12} className="shrink-0" />
                                  {item.tarjeta.nombre}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botón interactivo de estado de pago */}
                          <div className="shrink-0 sm:w-28 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePago(item.id)}
                              aria-pressed={pagada}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                pagada
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-gray-100'
                              }`}
                              title={pagada ? 'Marcar como pendiente' : 'Marcar como pagado este mes'}
                            >
                              {pagada ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                              <span>{pagada ? 'Pagado' : 'Pendiente'}</span>
                            </button>
                          </div>

                          <div className="shrink-0 text-right sm:w-28">
                            <span className="block text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">
                              {formatearMoneda(Number(item.monto), paisUsuario)}
                            </span>
                            <span className="block sm:hidden text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                              Día {item.diaCobro}
                            </span>
                          </div>

                          <div className="shrink-0 sm:w-20 flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditar(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                              aria-label={`Editar ${item.nombre}`}
                              title="Editar suscripción"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(item.id)}
                              disabled={eliminandoId === item.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                              aria-label={`Eliminar ${item.nombre}`}
                              title="Eliminar suscripción"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-[#0d1420] to-transparent" />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}