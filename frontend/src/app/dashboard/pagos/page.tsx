'use client';

import { useEffect, useState } from 'react';
import { pagosService } from '@/services/pagos.services';
import { tarjetasService } from '@/services/tarjetas.service';
import { suscripcionesService } from '@/services/suscripciones.service';
import { formatearMoneda } from '@/utils/formateadoresMoneda';
import Select, { type SelectOption } from '@/components/ui/Select';
import {
  Receipt,
  Plus,
  AlertCircle,
  CreditCard,
  Calendar,
  Wallet,
  Hash,
  TrendingDown,
  Clock,
  Trash2,
} from 'lucide-react';

interface Pago {
  id: string;
  concepto: string;
  monto: number;
  categoria?: string;
  creadoEn: string;
  tarjeta?: { nombre: string };
  suscripcion?: { nombre: string };
}

// En móvil el texto va a 16px para evitar el zoom automático de iOS al enfocar
const campoClase =
  'w-full px-3 py-1.5 bg-white dark:bg-[#070b12] border border-slate-300 dark:border-white/10 rounded-lg text-base sm:text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors';

const labelClase = 'block text-[13px] font-medium text-slate-700 dark:text-gray-300 mb-1';

const ayudaClase = 'mt-1 text-xs text-slate-500 dark:text-gray-500';

// Superficie base: igual que el dashboard y el navbar flotante
const superficie =
  'bg-white dark:bg-[#0d1420] border border-slate-200 dark:border-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const tarjetaClase = `${superficie} rounded-xl transition-colors`;

// Chip de ícono neutro
const chipNeutro =
  'flex shrink-0 items-center justify-center bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400';

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paisUsuario, setPaisUsuario] = useState('Costa Rica');

  const [form, setForm] = useState({
    concepto: '',
    monto: '',
    categoria: 'General',
    tarjetaId: '',
    suscripcionId: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const usuarioLocal = localStorage.getItem('usuario');
      if (usuarioLocal) {
        const parsed = JSON.parse(usuarioLocal);
        if (parsed.pais) setPaisUsuario(parsed.pais);
      }

      const [dataPagos, dataTarjetas, dataSuscripciones] = await Promise.all([
        pagosService.obtenerPagos(),
        tarjetasService.obtenerTarjetas(),
        suscripcionesService.obtenerSuscripciones(),
      ]);

      setPagos(dataPagos);
      setTarjetas(dataTarjetas);
      setSuscripciones(dataSuscripciones);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los datos de pagos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Al seleccionar una suscripción, autocompletar concepto, monto y tarjeta
  const handleSelectSuscripcion = (id: string) => {
    const sub = id ? suscripciones.find((s) => s.id === id) : null;
    if (sub) {
      setForm((prev) => ({
        ...prev,
        suscripcionId: id,
        concepto: `Pago de ${sub.nombre}`,
        monto: sub.monto.toString(),
        tarjetaId: sub.tarjetaId || '',
      }));
    } else {
      setForm((prev) => ({ ...prev, suscripcionId: id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    try {
      await pagosService.crearPago({
        concepto: form.concepto,
        monto: Number(form.monto),
        categoria: form.categoria,
        tarjetaId: form.tarjetaId || null,
        suscripcionId: form.suscripcionId || null,
      });

      setForm({ concepto: '', monto: '', categoria: 'General', tarjetaId: '', suscripcionId: '' });
      await cargarDatos();
    } catch (err: any) {
      setErrorForm(err.response?.data?.error || 'Error al registrar el pago.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este pago? Si estuvo asociado a una tarjeta, la deuda se ajustará.')) return;
    try {
      setEliminandoId(id);
      await pagosService.eliminarPago(id);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar el pago.');
    } finally {
      setEliminandoId(null);
    }
  };

  // Resumen calculado a partir de los pagos cargados
  const totalPagos = pagos.reduce((acc, item) => acc + Number(item.monto), 0);
  const promedio = pagos.length > 0 ? totalPagos / pagos.length : 0;
  const ultimoPago =
    pagos.length > 0
      ? pagos.reduce((a, b) => (new Date(b.creadoEn) > new Date(a.creadoEn) ? b : a))
      : null;

  // Opciones de los selects personalizados
  const opcionesSuscripcion: SelectOption[] = [
    { value: '', label: 'Pago libre o independiente' },
    ...suscripciones.map((sub) => ({
      value: sub.id,
      label: sub.nombre,
      hint: formatearMoneda(sub.monto, paisUsuario),
    })),
  ];

  const opcionesTarjeta: SelectOption[] = [
    { value: '', label: 'Sin tarjeta (efectivo o transferencia)' },
    ...tarjetas.map((tar) => ({
      value: tar.id,
      label: tar.nombre,
      hint: `Deuda ${formatearMoneda(tar.deudaActual, paisUsuario)}`,
    })),
  ];

  // Color solo como punto pequeño, igual que en el dashboard
  const resumen = [
    {
      label: 'Total pagado',
      valor: formatearMoneda(totalPagos, paisUsuario),
      icon: Wallet,
      punto: 'bg-emerald-500 dark:bg-emerald-400',
    },
    {
      label: 'Pagos registrados',
      valor: String(pagos.length),
      icon: Hash,
      punto: 'bg-cyan-500 dark:bg-cyan-400',
    },
    {
      label: 'Promedio por pago',
      valor: formatearMoneda(promedio, paisUsuario),
      icon: TrendingDown,
      punto: 'bg-violet-500 dark:bg-violet-400',
    },
    {
      label: 'Último pago',
      valor: ultimoPago ? formatearFecha(ultimoPago.creadoEn) : '—',
      icon: Clock,
      punto: 'bg-amber-500 dark:bg-amber-400',
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* Encabezado */}
      <header className="flex items-start gap-3 min-w-0">
        <span className={`${chipNeutro} h-9 w-9 rounded-lg`}>
          <Receipt size={20} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-gray-100">
            Pagos
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">
            Registra pagos únicos o abona a tus suscripciones y tarjetas de crédito.
          </p>
        </div>
      </header>

      {/* Resumen */}
      <section aria-label="Resumen de pagos" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
            <span className={`${chipNeutro} h-7 w-7 rounded-lg`}>
              <Plus size={15} />
            </span>
            Nuevo pago
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-gray-400 mt-0.5 mb-3">
            Completa los datos del pago.
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
              <label htmlFor="concepto" className={labelClase}>
                Concepto
              </label>
              <input
                id="concepto"
                type="text"
                required
                placeholder="Ej. Pago de luz, abono a tarjeta"
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="monto" className={labelClase}>
                Monto
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
              <label htmlFor="suscripcion" className={labelClase}>
                Suscripción <span className="font-normal text-slate-400 dark:text-gray-500">(opcional)</span>
              </label>
              <Select
                id="suscripcion"
                value={form.suscripcionId}
                onChange={handleSelectSuscripcion}
                options={opcionesSuscripcion}
                acento="emerald"
              />
              <p className={ayudaClase}>Autocompleta concepto, monto y tarjeta.</p>
            </div>

            <div>
              <label htmlFor="tarjeta" className={labelClase}>
                Pagar con tarjeta <span className="font-normal text-slate-400 dark:text-gray-500">(opcional)</span>
              </label>
              <Select
                id="tarjeta"
                value={form.tarjetaId}
                onChange={(valor) => setForm({ ...form, tarjetaId: valor })}
                options={opcionesTarjeta}
                acento="emerald"
              />
              <p className={ayudaClase}>Al elegir una tarjeta se reduce la deuda registrada.</p>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2 mt-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0d1420]"
            >
              {guardando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Registrar pago
                </>
              )}
            </button>
          </form>
        </section>

        {/* Historial */}
        <section className={`${tarjetaClase} relative min-w-0 overflow-hidden`}>
          <div className="flex h-full flex-col lg:absolute lg:inset-0">
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100">
                Historial de pagos
              </h2>
              {!loading && !error && pagos.length > 0 && (
                <span className="rounded-md bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-gray-400">
                  {pagos.length} {pagos.length === 1 ? 'registro' : 'registros'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-4 space-y-2 animate-pulse" aria-label="Cargando pagos">
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
            ) : pagos.length === 0 ? (
              <div className="flex-1 py-8 px-6 text-center text-slate-500 dark:text-gray-500 flex flex-col items-center justify-center gap-2">
                <span className={`${chipNeutro} h-10 w-10 rounded-full`}>
                  <Receipt size={20} />
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Aún no tienes pagos registrados
                </p>
                <p className="text-sm">Usa el formulario para registrar el primero.</p>
              </div>
            ) : (
              <>
                {/* Encabezado de columnas */}
                <div className="hidden sm:flex shrink-0 items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-gray-500">
                  <span className="flex-1 pl-10">Concepto</span>
                  <span className="w-24">Fecha</span>
                  <span className="w-28 text-right">Monto</span>
                  <span className="w-10 text-center">Acción</span>
                </div>

                {/* Lista con scroll y sin barra visible */}
                <div className="relative flex-1 min-h-0 flex flex-col">
                  <ul className="flex-1 min-h-0 max-h-[20rem] lg:max-h-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden divide-y divide-slate-200 dark:divide-white/10">
                    {pagos.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start sm:items-center gap-3 px-4 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                      >
                        <span className={`${chipNeutro} h-7 w-7 rounded-lg`}>
                          <Receipt size={16} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm break-words">
                            {item.concepto}
                          </h3>
                          {(item.tarjeta || item.suscripcion || item.categoria) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-gray-400">
                              {item.categoria && item.categoria !== 'General' && (
                                <span>{item.categoria}</span>
                              )}
                              {item.tarjeta && (
                                <span className="flex items-center gap-1">
                                  <CreditCard size={12} className="shrink-0" />
                                  {item.tarjeta.nombre}
                                </span>
                              )}
                              {item.suscripcion && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} className="shrink-0" />
                                  {item.suscripcion.nombre}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Fecha */}
                        <span className="hidden sm:block w-24 shrink-0 text-[13px] text-slate-500 dark:text-gray-400">
                          {formatearFecha(item.creadoEn)}
                        </span>

                        {/* Monto */}
                        <div className="shrink-0 text-right sm:w-28">
                          <span className="block text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">
                            -{formatearMoneda(Number(item.monto), paisUsuario)}
                          </span>
                          <span className="block sm:hidden text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                            {formatearFecha(item.creadoEn)}
                          </span>
                        </div>

                        {/* Botón eliminar */}
                        <div className="shrink-0 sm:w-10 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleEliminar(item.id)}
                            disabled={eliminandoId === item.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                            aria-label={`Eliminar ${item.concepto}`}
                            title="Eliminar pago"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
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