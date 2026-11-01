'use client';

import { useEffect, useState } from 'react';
import { ingresosService } from '@/services/ingresos.service';
import { formatearMoneda } from '@/utils/formateadoresMoneda';
import Select, { type SelectOption } from '@/components/ui/Select';
import {
  Wallet,
  Plus,
  AlertCircle,
  Hash,
  TrendingUp,
  Clock,
  Trash2,
  Edit3,
  X,
  Check,
} from 'lucide-react';

interface Ingreso {
  id: string;
  nombre: string;
  monto: number;
  frecuencia: string;
  creadoEn: string;
}

// En móvil el texto va a 16px para evitar el zoom automático de iOS al enfocar
const campoClase =
  'w-full px-3 py-1.5 bg-white dark:bg-[#070b12] border border-slate-300 dark:border-white/10 rounded-lg text-base sm:text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors';

const labelClase = 'block text-[13px] font-medium text-slate-700 dark:text-gray-300 mb-1';

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

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paisUsuario, setPaisUsuario] = useState('Costa Rica');

  const [form, setForm] = useState({
    nombre: '',
    monto: '',
    frecuencia: 'Mensual',
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

      const data = await ingresosService.obtenerIngresos();
      setIngresos(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los ingresos.');
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
        monto: Number(form.monto),
        frecuencia: form.frecuencia,
      };

      if (editandoId) {
        await ingresosService.actualizarIngreso(editandoId, payload);
      } else {
        await ingresosService.crearIngreso(payload);
      }

      setForm({ nombre: '', monto: '', frecuencia: 'Mensual' });
      setEditandoId(null);
      await cargarDatos();
    } catch (err: any) {
      setErrorForm(err.response?.data?.error || 'Error al guardar el ingreso.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (ingreso: Ingreso) => {
    setEditandoId(ingreso.id);
    setForm({
      nombre: ingreso.nombre,
      monto: ingreso.monto.toString(),
      frecuencia: ingreso.frecuencia || 'Mensual',
    });
  };

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setForm({ nombre: '', monto: '', frecuencia: 'Mensual' });
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return;
    try {
      setEliminandoId(id);
      await ingresosService.eliminarIngreso(id);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar el ingreso.');
    } finally {
      setEliminandoId(null);
    }
  };

  const totalIngresos = ingresos.reduce((acc, item) => acc + Number(item.monto), 0);
  const promedio = ingresos.length > 0 ? totalIngresos / ingresos.length : 0;
  const ultimoIngreso =
    ingresos.length > 0
      ? ingresos.reduce((a, b) => (new Date(b.creadoEn) > new Date(a.creadoEn) ? b : a))
      : null;

  const opcionesFrecuencia: SelectOption[] = [
    { value: 'Mensual', label: 'Mensual' },
    { value: 'Quincenal', label: 'Quincenal' },
    { value: 'Único', label: 'Único' },
    { value: 'Anual', label: 'Anual' },
  ];

  // Color solo como punto pequeño, igual que en el dashboard
  const resumen = [
    {
      label: 'Total ingresos',
      valor: formatearMoneda(totalIngresos, paisUsuario),
      icon: Wallet,
      punto: 'bg-emerald-500 dark:bg-emerald-400',
    },
    {
      label: 'Fuentes registradas',
      valor: String(ingresos.length),
      icon: Hash,
      punto: 'bg-cyan-500 dark:bg-cyan-400',
    },
    {
      label: 'Promedio por ingreso',
      valor: formatearMoneda(promedio, paisUsuario),
      icon: TrendingUp,
      punto: 'bg-violet-500 dark:bg-violet-400',
    },
    {
      label: 'Último registrado',
      valor: ultimoIngreso ? formatearFecha(ultimoIngreso.creadoEn) : '—',
      icon: Clock,
      punto: 'bg-amber-500 dark:bg-amber-400',
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-3">
      <header className="flex items-start gap-3 min-w-0">
        <span className={`${chipNeutro} h-9 w-9 rounded-lg`}>
          <Wallet size={20} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-gray-100">
            Gestión de ingresos
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">
            Registra y administra las entradas de dinero que alimentan tu balance en FYNIX.
          </p>
        </div>
      </header>

      <section aria-label="Resumen de ingresos" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {resumen.map(({ label, valor, icon: Icon, punto }) => (
          <div
            key={label}
            className={`min-w-0 flex min-h-[5.5rem] flex-col justify-between gap-2 ${superficie} p-3.5 rounded-xl transition-colors`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-gray-400">
                <span className={`h-2 w-2 shrink-0 rounded-full ${punto}`} />
                {label}
              </span>
              <span className={`${chipNeutro} hidden sm:flex h-7 w-7 rounded-lg`}>
                <Icon size={16} />
              </span>
            </div>
            {loading ? (
              <div className="h-6 w-24 rounded-md bg-slate-100 dark:bg-white/5 animate-pulse" />
            ) : (
              <p className="text-lg font-semibold tabular-nums break-words text-slate-900 dark:text-gray-100">
                {valor}
              </p>
            )}
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)] gap-3 lg:min-h-[28rem]">
        <section className={`${tarjetaClase} p-4`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
              <span className={`${chipNeutro} h-7 w-7 rounded-lg`}>
                {editandoId ? <Edit3 size={15} /> : <Plus size={15} />}
              </span>
              {editandoId ? 'Editar ingreso' : 'Nuevo ingreso'}
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
            {editandoId ? 'Modifica los datos del ingreso.' : 'Completa los datos de la entrada.'}
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
                Nombre o concepto
              </label>
              <input
                id="nombre"
                type="text"
                required
                placeholder="Ej. Salario mensual, Freelance..."
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
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
              <label htmlFor="frecuencia" className={labelClase}>
                Frecuencia
              </label>
              <Select
                id="frecuencia"
                value={form.frecuencia}
                onChange={(valor) => setForm({ ...form, frecuencia: valor })}
                options={opcionesFrecuencia}
                acento="emerald"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2 mt-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0d1420]"
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
                  Guardar ingreso
                </>
              )}
            </button>
          </form>
        </section>

        <section className={`${tarjetaClase} relative min-w-0 overflow-hidden`}>
          <div className="flex h-full flex-col lg:absolute lg:inset-0">
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100">
                Fuentes de ingreso activas
              </h2>
              {!loading && !error && ingresos.length > 0 && (
                <span className="rounded-md bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-gray-400">
                  {ingresos.length} {ingresos.length === 1 ? 'registro' : 'registros'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-4 space-y-2 animate-pulse" aria-label="Cargando ingresos">
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
            ) : ingresos.length === 0 ? (
              <div className="flex-1 py-10 px-6 text-center text-slate-500 dark:text-gray-500 flex flex-col items-center justify-center gap-2">
                <span className={`${chipNeutro} h-12 w-12 rounded-full`}>
                  <Wallet size={22} />
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  No tienes ingresos registrados todavía
                </p>
                <p className="text-sm">Usa el formulario para registrar el primero.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:flex shrink-0 items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-gray-500">
                  <span className="flex-1 pl-10">Concepto / Frecuencia</span>
                  <span className="w-24">Fecha</span>
                  <span className="w-28 text-right">Monto</span>
                  <span className="w-16 text-center">Acciones</span>
                </div>

                <div className="relative flex-1 min-h-0 flex flex-col">
                  <ul className="flex-1 min-h-0 max-h-[20rem] lg:max-h-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden divide-y divide-slate-200 dark:divide-white/10">
                    {ingresos.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start sm:items-center gap-3 px-4 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                      >
                        <span className={`${chipNeutro} h-7 w-7 rounded-lg`}>
                          <Wallet size={16} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm break-words">
                            {item.nombre}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-gray-400">
                            {item.frecuencia}
                          </span>
                        </div>

                        <span className="hidden sm:block w-24 shrink-0 text-[13px] text-slate-500 dark:text-gray-400">
                          {formatearFecha(item.creadoEn)}
                        </span>

                        <div className="shrink-0 text-right sm:w-28">
                          <span className="block text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{formatearMoneda(Number(item.monto), paisUsuario)}
                          </span>
                          <span className="block sm:hidden text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                            {formatearFecha(item.creadoEn)}
                          </span>
                        </div>

                        <div className="shrink-0 sm:w-16 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditar(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            aria-label={`Editar ${item.nombre}`}
                            title="Editar ingreso"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(item.id)}
                            disabled={eliminandoId === item.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                            aria-label={`Eliminar ${item.nombre}`}
                            title="Eliminar ingreso"
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