export const formatearMoneda = (monto: number, pais: string = 'Costa Rica') => {
  let moneda = 'CRC';
  let locale = 'es-CR';

  if (pais.toLowerCase().includes('méxico') || pais.toLowerCase().includes('mexico')) {
    moneda = 'MXN';
    locale = 'es-MX';
  } else if (pais.toLowerCase().includes('españa')) {
    moneda = 'EUR';
    locale = 'es-ES';
  } else if (pais.toLowerCase().includes('estados unidos') || pais.toLowerCase().includes('usa')) {
    moneda = 'USD';
    locale = 'en-US';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto);
};