'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Wallet,
  CreditCard,
  Calendar,
} from 'lucide-react';

const inputClase =
  'w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#070b12] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/40 focus:border-cyan-600 dark:focus:border-cyan-500 transition-colors';

const labelClase =
  'block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5';

const iconoClase =
  'absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none';

const beneficios = [
  { icon: Wallet, texto: 'Controla todos tus ingresos' },
  { icon: CreditCard, texto: 'Vigila tus tarjetas y fechas de pago' },
  { icon: Calendar, texto: 'Ordena tus suscripciones' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registroExitoso = searchParams.get('registro') === 'ok';

  const [form, setForm] = useState({ correo: '', password: '' });
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);

      // Guardamos el token y la información del usuario en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales inválidas o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-gray-100 transition-colors">
      {/* Brillos sutiles de fondo */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-cyan-200/40 dark:bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-emerald-200/40 dark:bg-emerald-500/10 blur-3xl" />

      {/* Panel izquierdo: marca */}
      <aside className="relative hidden lg:flex flex-col items-center justify-center px-12 py-12">
        <div className="flex flex-col items-center text-center w-full max-w-sm">
          <div className="relative w-24 h-24 xl:w-36 xl:h-36 mb-6">
            <Image
              src="/fynix-logo.webp"
              alt="FYNIX Logo"
              fill
              priority
              sizes="(min-width: 1280px) 176px, 144px"
              className="object-contain drop-shadow-[0_6px_16px_rgba(6,182,212,0.25)] dark:drop-shadow-[0_0_18px_rgba(6,182,212,0.4)]"
            />
          </div>

          <h2 className="-mt-2 pl-[0.15em] font-extrabold text-4xl xl:text-5xl tracking-[0.15em] text-slate-900 dark:text-white">
            FYNIX
          </h2>
          <p className="mt-1.5 text-base text-slate-500 dark:text-gray-400">
            Tus finanzas, en control
          </p>

          <ul className="mt-8 w-full space-y-4 text-left">
            {beneficios.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-600/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-400">
                  <Icon size={16} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Panel derecho: formulario */}
      <main className="relative flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo compacto solo en móvil */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="relative w-24 h-24">
              <Image
                src="/fynix-logo.webp"
                alt="FYNIX Logo"
                fill
                priority
                sizes="96px"
                className="object-contain drop-shadow-[0_4px_12px_rgba(6,182,212,0.3)]"
              />
            </div>
            <span className="-mt-1 pl-[0.15em] font-extrabold text-2xl tracking-[0.15em] text-slate-900 dark:text-white">
              FYNIX
            </span>
          </div>

          <div className="bg-white dark:bg-[#0b1320] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 transition-colors">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                Ingresa a tu panel de control financiero
              </p>
            </div>

            {/* Aviso: cuenta creada */}
            {registroExitoso && !error && (
              <div
                role="status"
                className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300 text-sm rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="shrink-0" />
                Cuenta creada. Ya puedes iniciar sesión.
              </div>
            )}

            {/* Aviso: error */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 text-sm rounded-lg flex items-center gap-2"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="correo" className={labelClase}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={18} className={iconoClase} />
                  <input
                    id="correo"
                    type="email"
                    name="correo"
                    required
                    autoComplete="email"
                    value={form.correo}
                    onChange={handleChange}
                    className={inputClase}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={labelClase}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={18} className={iconoClase} />
                  <input
                    id="password"
                    type={verPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    className={`${inputClase} pr-11`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors"
                  >
                    {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-cyan-700 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1320]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-gray-400 mt-6">
              ¿Aún no tienes cuenta?{' '}
              <Link
                href="/registro"
                className="text-cyan-700 dark:text-cyan-400 hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// useSearchParams requiere Suspense para que el build de producción no falle
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}