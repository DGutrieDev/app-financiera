'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  /** Texto secundario a la derecha (monto, deuda, etc.) */
  hint?: string;
  disabled?: boolean;
}

type Acento = 'emerald' | 'cyan';

// Clases completas para que Tailwind las detecte
const acentos: Record<Acento, { foco: string; abierto: string; seleccionado: string }> = {
  emerald: {
    foco: 'focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:border-emerald-600 dark:focus-visible:border-emerald-500',
    abierto: 'ring-2 ring-emerald-600/40 border-emerald-600 dark:border-emerald-500',
    seleccionado: 'text-emerald-700 dark:text-emerald-400',
  },
  cyan: {
    foco: 'focus-visible:ring-2 focus-visible:ring-cyan-600/40 focus-visible:border-cyan-600 dark:focus-visible:border-cyan-500',
    abierto: 'ring-2 ring-cyan-600/40 border-cyan-600 dark:border-cyan-500',
    seleccionado: 'text-cyan-700 dark:text-cyan-400',
  },
};

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  /** Si se indica, se envía el valor en formularios nativos */
  name?: string;
  placeholder?: string;
  /** Ícono opcional a la izquierda del campo */
  icon?: LucideIcon;
  acento?: Acento;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export default function Select({
  value,
  onChange,
  options,
  id,
  name,
  placeholder = 'Selecciona una opción',
  icon: Icon,
  acento = 'cyan',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: SelectProps) {
  const idAuto = useId();
  const idBoton = id ?? idAuto;
  const idLista = `${idBoton}-lista`;

  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const [haciaArriba, setHaciaArriba] = useState(false);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const busquedaRef = useRef({ texto: '', timer: 0 as unknown as ReturnType<typeof setTimeout> });

  const estilo = acentos[acento];
  const indiceSeleccionado = options.findIndex((o) => o.value === value);
  const seleccionada = indiceSeleccionado >= 0 ? options[indiceSeleccionado] : null;
  // Una opción con valor vacío funciona como "ninguna": se muestra atenuada
  const esVacio = !seleccionada || seleccionada.value === '';

  const primerHabilitado = () => options.findIndex((o) => !o.disabled);
  const ultimoHabilitado = () => {
    for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) return i;
    return -1;
  };

  const abrir = () => {
    if (disabled) return;
    // Si no hay espacio abajo, el menú se abre hacia arriba
    const rect = botonRef.current?.getBoundingClientRect();
    if (rect) {
      const abajo = window.innerHeight - rect.bottom;
      setHaciaArriba(abajo < 260 && rect.top > abajo);
    }
    setIndiceActivo(indiceSeleccionado >= 0 ? indiceSeleccionado : primerHabilitado());
    setAbierto(true);
  };

  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  };

  const elegir = (i: number) => {
    const opcion = options[i];
    if (!opcion || opcion.disabled) return;
    onChange(opcion.value);
    cerrar();
  };

  const mover = (delta: number) => {
    setIndiceActivo((prev) => {
      let i = prev;
      do {
        i += delta;
      } while (i >= 0 && i < options.length && options[i].disabled);
      return i < 0 || i >= options.length ? prev : i;
    });
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    const alHacerClic = (e: MouseEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', alHacerClic);
    return () => document.removeEventListener('mousedown', alHacerClic);
  }, [abierto]);

  // Mantener visible la opción activa al navegar con teclado
  useEffect(() => {
    if (!abierto || indiceActivo < 0) return;
    const el = listaRef.current?.children[indiceActivo] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [abierto, indiceActivo]);

  const buscarPorTexto = (tecla: string) => {
    const b = busquedaRef.current;
    clearTimeout(b.timer);
    b.texto += tecla.toLowerCase();
    b.timer = setTimeout(() => (b.texto = ''), 600);
    const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(b.texto));
    if (i >= 0) {
      if (!abierto) abrir();
      setIndiceActivo(i);
    }
  };

  const alPresionarTecla = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        abrir();
        return;
      }
    } else {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          mover(1);
          return;
        case 'ArrowUp':
          e.preventDefault();
          mover(-1);
          return;
        case 'Home':
          e.preventDefault();
          setIndiceActivo(primerHabilitado());
          return;
        case 'End':
          e.preventDefault();
          setIndiceActivo(ultimoHabilitado());
          return;
        case 'Enter':
        case ' ':
          e.preventDefault();
          elegir(indiceActivo);
          return;
        case 'Escape':
          e.preventDefault();
          cerrar();
          return;
        case 'Tab':
          cerrar(false);
          return;
      }
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
      buscarPorTexto(e.key);
    }
  };

  return (
    <div ref={contenedorRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}

      <button
        ref={botonRef}
        id={idBoton}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-label={ariaLabel}
        aria-activedescendant={abierto && indiceActivo >= 0 ? `${idLista}-${indiceActivo}` : undefined}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={alPresionarTecla}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left bg-white dark:bg-[#070b12] border border-slate-300 dark:border-slate-700 rounded-lg text-base sm:text-sm text-slate-900 dark:text-gray-100 transition-colors focus:outline-none ${estilo.foco} disabled:opacity-50 disabled:cursor-not-allowed ${
          abierto ? estilo.abierto : ''
        }`}
      >
        {Icon && <Icon size={18} className="shrink-0 text-slate-400 dark:text-gray-500" />}
        <span
          className={`flex-1 truncate ${
            esVacio ? 'text-slate-500 dark:text-gray-500' : 'text-slate-900 dark:text-gray-100'
          }`}
        >
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 dark:text-gray-500 transition-transform duration-150 ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierto && (
        <ul
          ref={listaRef}
          id={idLista}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-30 max-h-60 overflow-y-auto p-1 bg-white dark:bg-[#0b1320] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg [scrollbar-width:thin] ${
            haciaArriba ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {options.map((opcion, i) => {
            const esSeleccionada = opcion.value === value;
            const esActiva = i === indiceActivo;

            return (
              <li
                key={`${opcion.value}-${i}`}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={esSeleccionada}
                aria-disabled={opcion.disabled || undefined}
                // mousedown evita que el botón pierda el foco antes del clic
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => !opcion.disabled && setIndiceActivo(i)}
                onClick={() => elegir(i)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-base sm:text-sm cursor-pointer select-none transition-colors ${
                  opcion.disabled ? 'opacity-40 cursor-not-allowed' : ''
                } ${esActiva ? 'bg-slate-100 dark:bg-white/[0.06]' : ''} ${
                  esSeleccionada
                    ? `font-medium ${estilo.seleccionado}`
                    : 'text-slate-700 dark:text-gray-300'
                }`}
              >
                <span className="flex-1 min-w-0 truncate">{opcion.label}</span>
                {opcion.hint && (
                  <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-gray-500">
                    {opcion.hint}
                  </span>
                )}
                <span className="w-4 shrink-0">
                  {esSeleccionada && <Check size={16} />}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}