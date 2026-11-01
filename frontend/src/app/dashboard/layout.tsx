'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './animation.css';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Calendar,
  ShoppingBag,
  Receipt,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

// Cada sección conserva su color de acento (ícono + fondo suave)
const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: 'text-cyan-600 dark:text-cyan-400',
    fondo: 'bg-cyan-600/10 dark:bg-cyan-400/10',
  },
  {
    href: '/dashboard/ingresos',
    label: 'Ingresos',
    icon: Wallet,
    color: 'text-emerald-600 dark:text-emerald-400',
    fondo: 'bg-emerald-600/10 dark:bg-emerald-400/10',
  },
  {
    href: '/dashboard/tarjetas',
    label: 'Tarjetas',
    icon: CreditCard,
    color: 'text-amber-600 dark:text-amber-400',
    fondo: 'bg-amber-500/10 dark:bg-amber-400/10',
  },
  {
    href: '/dashboard/suscripciones',
    label: 'Suscripciones',
    icon: Calendar,
    color: 'text-sky-600 dark:text-sky-400',
    fondo: 'bg-sky-600/10 dark:bg-sky-400/10',
  },
  {
    href: '/dashboard/gastos',
    label: 'Gastos',
    icon: ShoppingBag,
    color: 'text-rose-600 dark:text-rose-400',
    fondo: 'bg-rose-600/10 dark:bg-rose-400/10',
  },
  {
    href: '/dashboard/pagos',
    label: 'Pagos',
    icon: Receipt,
    color: 'text-violet-600 dark:text-violet-400',
    fondo: 'bg-violet-600/10 dark:bg-violet-400/10',
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [oscuro, setOscuro] = useState(false);
  const [montado, setMontado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false); // menú desplegable en móvil / tablet

  // Leer el tema guardado al montar
  useEffect(() => {
    setOscuro(document.documentElement.classList.contains('dark'));
    setMontado(true);
  }, []);

  // Cerrar el menú al navegar
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Cerrar con Escape
  useEffect(() => {
    if (!menuAbierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [menuAbierto]);

  const cambiarTema = () => {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    document.documentElement.classList.toggle('dark', nuevo);
    try {
      localStorage.setItem('tema', nuevo ? 'dark' : 'light');
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  const modoOscuro = montado && oscuro;

  const esActivo = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const botonIconoClase =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070b12] dark:text-gray-100 transition-colors">
      {/* Fondo para cerrar el menú desplegable al hacer clic fuera */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Navbar flotante: se queda pegada arriba con margen alrededor */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4 2xl:px-8">
        <div className="relative mx-auto max-w-[120rem]">
          <div className="flex h-14 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-2.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1420]/80 dark:shadow-black/30 transition-colors">
            {/* Marca */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-xl pl-1 pr-2"
              aria-label="FYNIX - Ir al dashboard"
            >
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src="/fynix-logo.webp"
                  alt="FYNIX Logo"
                  fill
                  priority
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-lg tracking-[0.15em] text-slate-900 dark:text-white">
                FYNIX
              </span>
            </Link>

            {/* Secciones (escritorio) */}
            <nav
              className="hidden lg:flex flex-1 items-center justify-center gap-1"
              aria-label="Navegación principal"
            >
              {navItems.map(({ href, label, icon: Icon, color, fondo }) => {
                const activo = esActivo(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={activo ? 'page' : undefined}
                    className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                      activo
                        ? `${fondo} text-slate-900 font-semibold dark:text-white`
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100 font-medium'
                    }`}
                  >
                    <Icon size={17} className={color} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Acciones (escritorio) */}
            <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-2 dark:border-white/10">
              <button
                type="button"
                onClick={cambiarTema}
                aria-label="Cambiar entre modo claro y oscuro"
                title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className={botonIconoClase}
              >
                {modoOscuro ? (
                  <Moon size={18} className="text-cyan-400" />
                ) : (
                  <Sun size={18} className="text-amber-500" />
                )}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Botón de menú (móvil / tablet) */}
            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={cambiarTema}
                aria-label="Cambiar entre modo claro y oscuro"
                className={botonIconoClase}
              >
                {modoOscuro ? (
                  <Moon size={18} className="text-cyan-400" />
                ) : (
                  <Sun size={18} className="text-amber-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                aria-controls="menu-movil"
                aria-expanded={menuAbierto}
                className={botonIconoClase}
              >
                {menuAbierto ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Panel desplegable flotante (móvil / tablet) */}
          {menuAbierto && (
            <div
              id="menu-movil"
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1420]/95 dark:shadow-black/40 lg:hidden"
            >
              <nav className="grid grid-cols-2 gap-1" aria-label="Navegación principal">
                {navItems.map(({ href, label, icon: Icon, color, fondo }) => {
                  const activo = esActivo(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={activo ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        activo
                          ? `${fondo} text-slate-900 font-semibold dark:text-white`
                          : 'text-slate-600 hover:bg-slate-200/50 dark:text-gray-400 dark:hover:bg-white/[0.05] font-medium'
                      }`}
                    >
                      <Icon size={18} className={color} />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-2 border-t border-slate-200 pt-2 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-gray-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 transition-colors"
                >
                  <LogOut size={18} className="text-rose-600 dark:text-rose-400" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[120rem] min-w-0 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4 2xl:px-8 transition-colors">
        {/* La key por ruta remonta el contenido en cada cambio de página y reinicia la animación */}
        <div key={pathname} className="pagina-entrada">
          {children}
        </div>
      </main>
    </div>
  );
}