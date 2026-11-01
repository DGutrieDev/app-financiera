'use client';

import { useEffect, useState } from 'react';
import { tarjetasService } from '@/services/tarjetas.service';
import { formatearMoneda } from '@/utils/formateadoresMoneda';
import {
  CreditCard,
  Plus,
  AlertCircle,
  Calendar,
  Wallet,
  TrendingDown,
  Clock,
  Trash2,
  Edit3,
  X,
  Check,
} from 'lucide-react';

interface Tarjeta {
  id: string;
  nombre: string;
  limite?: number;
  diaPago: number;
  deudaActual: number;
  creadoEn?: string;
}

// En móvil el texto va a 16px para evitar el zoom automático de iOS al enfocar
const campoClase =
  'w-full px-3 py-1.5 bg-white dark:bg-[#070b12] border border-slate-300 dark:border-white/10 rounded-lg text-base sm:text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 dark:focus:border-amber-500 transition-colors';

const labelClase = 'block text-[13px] font-medium text-slate-700 dark:text-gray-300 mb-1';

// Superficie base: igual que el dashboard y el navbar flotante
const superficie =
  'bg-white dark:bg-[#0d1420] border border-slate-200 dark:border-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const tarjetaClase = `${superficie} rounded-xl transition-colors`;

// Chip de ícono neutro
const chipNeutro =
  'flex shrink-0 items-center justify-center bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400';

const formatearFecha = (fecha?: string) =>
  fecha
    ? new Date(fecha).toLocaleDateString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export default function TarjetasPage() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paisUsuario, setPaisUsuario] = useState('Costa Rica');

  const [form, setForm] = useState({
    nombre: '',
    limite: '',
    deudaActual: '',
    diaPago: '',
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

      const data = await tarjetasService.obtenerTarjetas();
      setTarjetas(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las tarjetas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    try {
      const payload = {
        nombre: form.nombre,
        limite: Number(form.limite),
        deudaActual: Number(form.deudaActual),
        diaPago: Number(form.diaPago),
      };

      if (editandoId) {
        await tarjetasService.actualizarTarjeta(editandoId, payload);
      } else {
        await tarjetasService.crearTarjeta(payload);
      }

      setForm({ nombre: '', limite: '', deudaActual: '', diaPago: '' });
      setEditandoId(null);
      await cargarDatos();
    } catch (err: any) {
      setErrorForm(err.response?.data?.error || 'Error al guardar la tarjeta.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (tarjeta: Tarjeta) => {
    setEditandoId(tarjeta.id);
    setForm({
      nombre: tarjeta.nombre,
      limite: (tarjeta.limite ?? 0).toString(),
      deudaActual: tarjeta.deudaActual.toString(),
      diaPago: tarjeta.diaPago.toString(),
    });
  };

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setForm({ nombre: '', limite: '', deudaActual: '', diaPago: '' });
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarjeta?')) return;
    try {
      setEliminandoId(id);
      await tarjetasService.eliminarTarjeta(id);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar la tarjeta.');
    } finally {
      setEliminandoId(null);
    }
  };

  // Resumen calculado
  const deudaTotal = tarjetas.reduce((acc, item) => acc + Number(item.deudaActual || 0), 0);
  const limiteTotal = tarjetas.reduce((acc, item) => acc + Number(item.limite || 0), 0);
  const promedioDeuda = tarjetas.length > 0 ? deudaTotal / tarjetas.length : 0;
  const ultimaTarjeta =
    tarjetas.length > 0
      ? tarjetas.reduce((a, b) => (new Date(b.creadoEn || 0) > new Date(a.creadoEn || 0) ? b : a))
      : null;

  // Color solo como punto pequeño, igual que en el dashboard
  const resumen = [
    {
      label: 'Deuda total',
      valor: formatearMoneda(deudaTotal, paisUsuario),
      icon: Wallet,
      punto: 'bg-amber-500 dark:bg-amber-400',
    },
    {
      label: 'Límite total',
      valor: formatearMoneda(limiteTotal, paisUsuario),
      icon: CreditCard,
      punto: 'bg-cyan-500 dark:bg-cyan-400',
    },
    {
      label: 'Promedio deuda',
      valor: formatearMoneda(promedioDeuda, paisUsuario),
      icon: TrendingDown,
      punto: 'bg-violet-500 dark:bg-violet-400',
    },
    {
      label: 'Última registrada',
      valor: ultimaTarjeta?.creadoEn ? formatearFecha(ultimaTarjeta.creadoEn) : '—',
      icon: Clock,
      punto: 'bg-emerald-500 dark:bg-emerald-400',
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* Encabezado */}
      <header className="flex items-start gap-3 min-w-0">
        <span className={`${chipNeutro} h-9 w-9 rounded-lg`}>
          <CreditCard size={20} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-gray-100">
            Tarjetas de crédito
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">
            Controla tus deudas, límites y disponibilidad de crédito al día.
          </p>
        </div>
      </header>

      {/* Resumen */}
      <section aria-label="Resumen de tarjetas" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              {editandoId ? 'Editar tarjeta' : 'Nueva tarjeta'}
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
            {editandoId ? 'Modifica los datos de la tarjeta.' : 'Completa los datos de la tarjeta.'}
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
                Nombre de la tarjeta
              </label>
              <input
                id="nombre"
                type="text"
                required
                placeholder="Ej. Visa Platinum, BAC CashBack..."
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="limite" className={labelClase}>
                Límite de crédito
              </label>
              <input
                id="limite"
                type="number"
                inputMode="decimal"
                step="any"
                required
                placeholder="0.00"
                value={form.limite}
                onChange={(e) => setForm({ ...form, limite: e.target.value })}
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="deudaActual" className={labelClase}>
                Monto adeudado (deuda actual)
              </label>
              <input
                id="deudaActual"
                type="number"
                inputMode="decimal"
                step="any"
                required
                placeholder="0.00"
                value={form.deudaActual}
                onChange={(e) => setForm({ ...form, deudaActual: e.target.value })}
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="diaPago" className={labelClase}>
                Día límite de pago
              </label>
              <input
                id="diaPago"
                type="number"
                min="1"
                max="31"
                required
                placeholder="Ej. 15"
                value={form.diaPago}
                onChange={(e) => setForm({ ...form, diaPago: e.target.value })}
                className={campoClase}
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2 mt-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0d1420]"
            >
              {guardando ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
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
                  Registrar tarjeta
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
                Tarjetas registradas
              </h2>
              {!loading && !error && tarjetas.length > 0 && (
                <span className="rounded-md bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-gray-400">
                  {tarjetas.length} {tarjetas.length === 1 ? 'registro' : 'registros'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-4 space-y-2 animate-pulse" aria-label="Cargando tarjetas">
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
            ) : tarjetas.length === 0 ? (
              <div className="flex-1 py-8 px-6 text-center text-slate-500 dark:text-gray-500 flex flex-col items-center justify-center gap-2">
                <span className={`${chipNeutro} h-10 w-10 rounded-full`}>
                  <CreditCard size={20} />
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  No tienes tarjetas de crédito registradas
                </p>
                <p className="text-sm">Usa el formulario para registrar la primera.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:flex shrink-0 items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-gray-500">
                  <span className="flex-1 pl-10">Nombre / Día de pago</span>
                  <span className="w-28 text-right">Disponible / Límite</span>
                  <span className="w-28 text-right">Deuda actual</span>
                  <span className="w-16 text-center">Acciones</span>
                </div>

                <div className="relative flex-1 min-h-0 flex flex-col">
                  <ul className="flex-1 min-h-0 max-h-[20rem] lg:max-h-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden divide-y divide-slate-200 dark:divide-white/10">
                    {tarjetas.map((item) => {
                      const limite = Number(item.limite || 0);
                      const deuda = Number(item.deudaActual || 0);
                      const disponible = Math.max(limite - deuda, 0);

                      return (
                        <li
                          key={item.id}
                          className="flex items-start sm:items-center gap-3 px-4 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                        >
                          <span className={`${chipNeutro} h-7 w-7 rounded-lg`}>
                            <CreditCard size={16} />
                          </span>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm break-words">
                              {item.nombre}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-gray-400">
                              <Calendar size={12} className="shrink-0" /> Día de pago: {item.diaPago}
                            </div>
                          </div>

                          {/* Crédito disponible / límite (sm+) */}
                          <div className="hidden sm:block w-28 shrink-0 text-right">
                            <span className="block text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {formatearMoneda(disponible, paisUsuario)}
                            </span>
                            <span className="block text-[11px] text-slate-400 dark:text-gray-500">
                              Límite: {formatearMoneda(limite, paisUsuario)}
                            </span>
                          </div>

                          {/* Deuda actual */}
                          <div className="shrink-0 text-right sm:w-28">
                            <span className="block text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">
                              {formatearMoneda(deuda, paisUsuario)}
                            </span>
                            <span className="block sm:hidden text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                              Disp: {formatearMoneda(disponible, paisUsuario)}
                            </span>
                          </div>

                          <div className="shrink-0 sm:w-16 flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditar(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                              aria-label={`Editar ${item.nombre}`}
                              title="Editar tarjeta"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(item.id)}
                              disabled={eliminandoId === item.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                              aria-label={`Eliminar ${item.nombre}`}
                              title="Eliminar tarjeta"
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