'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatearMoneda } from '@/utils/formateadoresMoneda';
import {
  Wallet,
  CreditCard,
  Calendar,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface DashboardData {
  usuario: {
    nombre: string;
    apellido: string;
    pais: string;
    correo: string;
  };
  filtroMes: string; // "YYYY-MM"
  resumen: {
    totalIngresos: number;
    totalGastosFijos: number;
    totalGastosFijosProyectado: number;
    totalGastosVariables: number;
    totalDeudaTarjetas: number;
    totalPagos?: number;
    balanceNeto: number;
  };
  graficos: {
    distribucionGastos: Array<{ categoria: string; monto: number }>;
    evolucionMensual: Array<{ mes: string; nombre: string; ingresos: number; gastosTotales: number }>;
    gastosPorCategoria: Array<{ categoria: string; monto: number }>;
  };
}

// Superficie base: igual en todas las páginas y en el navbar flotante
const superficie =
  'bg-white dark:bg-[#0d1420] border border-slate-200 dark:border-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

// Chip de ícono neutro
const chipNeutro =
  'flex shrink-0 items-center justify-center bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400';

// "YYYY-MM" con la fecha local (toISOString usa UTC y puede cambiar de mes cerca de la medianoche)
const aClaveMes = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;

function obtenerSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatoMonto(monto: number, pais: string) {
  return formatearMoneda(monto, pais).replace(/[^0-9.,]/g, '');
}

function DashboardSkeleton() {
  const bloque = 'bg-slate-200 dark:bg-[#0d1420]';
  return (
    <div className="w-full min-w-0 space-y-3 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className={`h-7 w-60 rounded-lg ${bloque}`} />
          <div className={`h-4 w-44 rounded-lg ${bloque}`} />
        </div>
        <div className={`h-10 w-52 rounded-xl ${bloque}`} />
      </div>
      <div className={`h-28 rounded-xl ${bloque}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`h-[4.25rem] rounded-xl ${bloque}`} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`h-64 rounded-xl ${bloque}`} />
        <div className={`h-64 rounded-xl ${bloque}`} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

// Estados para controlar el mes seleccionado y el mes actual de forma segura
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [mesActualStr, setMesActualStr] = useState('');

  const cargarDashboard = async (mesQuery?: string) => {
    try {
      setLoading(true);
      setError('');
      const url = mesQuery ? `/dashboard?mes=${mesQuery}` : '/dashboard';
      const res = await api.get(url);
      setData(res.data);
      if (res.data?.filtroMes) {
        setMesSeleccionado(res.data.filtroMes);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar la información del dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const actual = aClaveMes(new Date());
    setMesActualStr(actual);
    setMesSeleccionado(actual);
    cargarDashboard(actual);
  }, []);

  const cambiarMes = (direccion: 'prev' | 'next') => {
    if (!mesSeleccionado) return;
    const [anio, mes] = mesSeleccionado.split('-').map(Number);
    const nuevaFecha = new Date(anio, mes - 1 + (direccion === 'next' ? 1 : -1), 1);
    const nuevoMesStr = aClaveMes(nuevaFecha);

    // Evitar avanzar más allá del mes actual
    if (direccion === 'next' && nuevoMesStr > mesActualStr) {
      return;
    }

    setMesSeleccionado(nuevoMesStr);
    cargarDashboard(nuevoMesStr);
  };

  const esMesActual = mesSeleccionado && mesActualStr ? mesSeleccionado >= mesActualStr : false;

  const formatearNombreMes = (anioMes: string) => {
    const [anio, mes] = anioMes.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, 1);
    const texto = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  if (loading && !data) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 rounded-xl text-sm shadow-sm">
        {error || 'No se pudo cargar la información.'}
      </div>
    );
  }

  const { usuario, resumen, graficos } = data;
  const paisUsuario = usuario.pais || 'Costa Rica';
  const balancePositivo = resumen.balanceNeto >= 0;

  const ingresos = resumen.totalIngresos;
  const totalPagos = resumen.totalPagos || 0;
  const totalGastos = resumen.totalGastosFijos + resumen.totalGastosVariables;

  const disponible = Math.max(ingresos - totalGastos - totalPagos, 0);

  const pct = (valor: number) => (ingresos > 0 ? Math.min((valor / ingresos) * 100, 100) : 0);
  const pctFijos = pct(resumen.totalGastosFijos);
  const pctVariables = pct(resumen.totalGastosVariables);
  const pctPagos = pct(totalPagos);
  const pctDisponible = pct(disponible);

  const pctGastado = Math.min(pctFijos + pctVariables, 100);
  const pctTotalComprometido = Math.min(pctGastado + pctPagos, 100);

  const evolucion = graficos?.evolucionMensual ?? [];
  const maxEvolucion = Math.max(...evolucion.flatMap((m) => [m.gastosTotales, m.ingresos]), 1);
  const categorias = graficos?.gastosPorCategoria ?? [];
  const paletaCategorias = [
    'bg-violet-500 dark:bg-violet-400',
    'bg-cyan-500 dark:bg-cyan-400',
    'bg-amber-500 dark:bg-amber-400',
    'bg-rose-500 dark:bg-rose-400',
    'bg-emerald-500 dark:bg-emerald-400',
    'bg-sky-500 dark:bg-sky-400',
  ];

  // Mientras se carga otro mes, las secciones se atenúan
  const atenuar = `transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`;

  // Color solo como punto pequeño que enlaza con la barra de distribución
  const metricas = [
    { label: 'Ingresos mensuales', valor: formatearMoneda(resumen.totalIngresos, paisUsuario), icon: Wallet, punto: 'bg-emerald-500 dark:bg-emerald-400' },
    { label: 'Gastos fijos pagados', valor: formatearMoneda(resumen.totalGastosFijos, paisUsuario), icon: Calendar, punto: 'bg-cyan-500 dark:bg-cyan-400' },
    { label: 'Gastos variables', valor: formatearMoneda(resumen.totalGastosVariables, paisUsuario), icon: ShoppingBag, punto: 'bg-violet-500 dark:bg-violet-400' },
    { label: 'Deuda en tarjetas', valor: formatearMoneda(resumen.totalDeudaTarjetas, paisUsuario), icon: CreditCard, punto: 'bg-amber-500 dark:bg-amber-400' },
  ];

  const botonMes =
    'flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100 transition-colors';

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* Encabezado + selector de mes */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-gray-100">
            {obtenerSaludo()}, {usuario.nombre}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">
            Aquí tienes un resumen de tus finanzas y la evolución de tus gastos e ingresos.
          </p>
        </div>

        {/* Selector de mes con el mismo estilo del navbar */}
        <div className="flex items-center gap-1 self-start sm:self-auto rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1420]/80">
          <button
            type="button"
            onClick={() => cambiarMes('prev')}
            className={botonMes}
            aria-label="Mes anterior"
            title="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            className="px-2 text-sm font-medium text-slate-800 dark:text-gray-200 min-w-[8.5rem] text-center"
            aria-live="polite"
          >
            {formatearNombreMes(mesSeleccionado)}
          </div>

          <button
            type="button"
            onClick={() => cambiarMes('next')}
            disabled={esMesActual}
            className={`${botonMes} ${esMesActual ? 'opacity-40 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent' : ''}`}
            aria-label="Mes siguiente"
            title={esMesActual ? 'No se pueden consultar meses futuros' : 'Mes siguiente'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* Balance: banner compacto con la distribución al lado */}
      <section aria-busy={loading} className={`${superficie} rounded-xl p-4 ${atenuar}`}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
                Balance de {formatearNombreMes(mesSeleccionado)}
              </p>
              <span
                className={`flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  balancePositivo
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
                }`}
              >
                {balancePositivo ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {balancePositivo ? 'En positivo' : 'En negativo'}
              </span>
            </div>
            <p
              className={`mt-1 text-3xl md:text-4xl font-bold tracking-tight tabular-nums break-words ${
                balancePositivo
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatearMoneda(resumen.balanceNeto, paisUsuario)}
            </p>
          </div>

          <div className="lg:border-l lg:border-slate-200 dark:lg:border-white/10 lg:pl-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 dark:text-gray-400 mb-2 gap-1">
              <span>Uso de tus ingresos este mes</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                <span className="text-violet-600 dark:text-violet-400">Gastado: {pctGastado.toFixed(0)}%</span>
                <span className="text-amber-600 dark:text-amber-400">Pagado: {pctPagos.toFixed(0)}%</span>
                <span className="text-slate-800 dark:text-gray-200 font-semibold">
                  Comprometido: {pctTotalComprometido.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/5">
              <div className="bg-cyan-500 dark:bg-cyan-400 transition-all duration-700" style={{ width: `${pctFijos}%` }} title="Fijos" />
              <div className="bg-violet-500 dark:bg-violet-400 transition-all duration-700" style={{ width: `${pctVariables}%` }} title="Variables" />
              <div className="bg-amber-500 dark:bg-amber-400 transition-all duration-700" style={{ width: `${pctPagos}%` }} title="Pagos" />
              <div className="bg-emerald-400 dark:bg-emerald-400/70 transition-all duration-700" style={{ width: `${pctDisponible}%` }} title="Disponible" />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-cyan-500 dark:bg-cyan-400" />
                Fijos {pctFijos.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-violet-500 dark:bg-violet-400" />
                Variables {pctVariables.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-amber-500 dark:bg-amber-400" />
                Pagos {pctPagos.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-emerald-400 dark:bg-emerald-400/70" />
                Disponible {pctDisponible.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Métricas: mismo tamaño de card que en el resto de páginas */}
      <section className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${atenuar}`}>
        {metricas.map(({ label, valor, icon: Icon, punto }) => (
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
              <p className="mt-0.5 text-lg font-semibold leading-tight tabular-nums break-words text-slate-900 dark:text-gray-100">
                {valor}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Gráficos */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3 ${atenuar}`}>
        {/* Evolución: gastos vs ingresos */}
        <section className={`${superficie} p-4 rounded-xl`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-400 dark:text-gray-500" />
              Evolución (últimos 6 meses)
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                Gastos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Ingresos
              </span>
            </div>
          </div>

          {evolucion.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400 dark:text-gray-500">
              Aún no hay historial para mostrar.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {evolucion.map((item, index) => (
                <div key={`${item.mes}-${index}`} className="space-y-1">
                  <div className="flex justify-between gap-2 text-xs text-slate-600 dark:text-gray-400">
                    <span className="font-medium">{item.nombre}</span>
                    <span className="tabular-nums font-semibold text-slate-800 dark:text-gray-200">
                      {formatearMoneda(item.gastosTotales, paisUsuario)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((item.gastosTotales / maxEvolucion) * 100, 100)}%` }}
                    />
                  </div>
                  <div
                    className="h-1 rounded-full bg-emerald-500/70 dark:bg-emerald-400/60 transition-all duration-500"
                    style={{ width: `${Math.min((item.ingresos / maxEvolucion) * 100, 100)}%` }}
                    title={`Ingresos: ${formatearMoneda(item.ingresos, paisUsuario)}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gastos variables por categoría */}
        <section className={`${superficie} p-4 rounded-xl flex flex-col`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
            <PieChart size={16} className="text-slate-400 dark:text-gray-500" />
            Gastos variables por categoría
          </h2>
          {categorias.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-10 text-center text-sm text-slate-400 dark:text-gray-500">
              No hay gastos variables registrados en este mes.
            </div>
          ) : (
            <>
              {/* Barra segmentada con el reparto total */}
              <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                {categorias.map((cat, index) => (
                  <div
                    key={`seg-${cat.categoria}-${index}`}
                    className={`${paletaCategorias[index % paletaCategorias.length]} transition-all duration-500`}
                    style={{ width: `${(cat.monto / (resumen.totalGastosVariables || 1)) * 100}%` }}
                    title={cat.categoria}
                  />
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {categorias.map((cat, index) => {
                  const totalVariables = resumen.totalGastosVariables || 1;
                  const porcentajeCat = (cat.monto / totalVariables) * 100;
                  const color = paletaCategorias[index % paletaCategorias.length];

                  return (
                    <div key={`${cat.categoria}-${index}`} className="space-y-1">
                      <div className="flex justify-between gap-2 text-xs text-slate-600 dark:text-gray-400">
                        <span className="flex min-w-0 items-center gap-2 font-medium">
                          <span className={`h-2 w-2 shrink-0 rounded-sm ${color}`} />
                          <span className="truncate">{cat.categoria}</span>
                        </span>
                        <span className="tabular-nums font-semibold shrink-0 text-slate-800 dark:text-gray-200">
                          {formatearMoneda(cat.monto, paisUsuario)}{' '}
                          <span className="font-normal text-slate-500 dark:text-gray-500">
                            ({porcentajeCat.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${color}`}
                          style={{ width: `${porcentajeCat}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total pegado abajo */}
              <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10">
                <span className="text-xs text-slate-500 dark:text-gray-400">Total variables</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">
                  {formatearMoneda(resumen.totalGastosVariables, paisUsuario)}
                </span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}