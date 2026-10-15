import type { Atributos, EstadoPedido, Genero, TipoProducto } from '../api/tipos';

const numero = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 15050 → "Bs 150,50" */
export const bs = (centavos: number) => `Bs ${numero.format(centavos / 100)}`;

const fechaLarga = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
const fechaHora = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const hora = new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export const fecha = (iso: string) => fechaLarga.format(new Date(iso));
export const diaHora = (iso: string) => fechaHora.format(new Date(iso));
export const soloHora = (iso: string) => hora.format(new Date(iso));

export const TIPOS: Record<TipoProducto, { uno: string; varios: string }> = {
  MONTURA: { uno: 'Montura', varios: 'Monturas' },
  GAFAS_SOL: { uno: 'Gafas de sol', varios: 'Gafas de sol' },
  LENTE_CONTACTO: { uno: 'Lentes de contacto', varios: 'Lentes de contacto' },
  LENTE_OFTALMICO: { uno: 'Lente oftálmico', varios: 'Lentes oftálmicos' },
  LIQUIDO: { uno: 'Solución', varios: 'Soluciones y gotas' },
  ACCESORIO: { uno: 'Accesorio', varios: 'Accesorios' },
  SERVICIO: { uno: 'Servicio', varios: 'Servicios' },
};

/** Orden en que se muestran las categorías. */
export const ORDEN_TIPOS: TipoProducto[] = ['MONTURA', 'GAFAS_SOL', 'LENTE_CONTACTO', 'LENTE_OFTALMICO', 'LIQUIDO', 'ACCESORIO', 'SERVICIO'];

export const GENEROS: Record<Genero, string> = { MUJER: 'Mujer', HOMBRE: 'Hombre', NINO: 'Niños', UNISEX: 'Unisex' };

export const ESTADOS: Record<EstadoPedido, string> = {
  PENDIENTE_PAGO: 'Esperando pago',
  PAGADO: 'Pagado',
  PREPARANDO: 'En preparación',
  LISTO: 'Listo para retirar',
  ENVIADO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

/**
 * Medidas de una montura en la notación de las ópticas: 52□18 140
 * (ancho del lente □ puente, largo de la varilla), en milímetros.
 */
export function medidas(a: Atributos): string | null {
  if (!a.calibre || !a.puente) return null;
  return `${a.calibre}□${a.puente}${a.varilla ? ` ${a.varilla}` : ''}`;
}

/** Atributos que vale la pena mostrar, con su nombre. */
export function fichaTecnica(a: Atributos): [string, string][] {
  const filas: [string, string | undefined][] = [
    ['Para', a.genero ? GENEROS[a.genero] : undefined],
    ['Material', a.material],
    ['Forma', a.forma],
    ['Color', a.color],
    ['Ancho del lente', a.calibre ? `${a.calibre} mm` : undefined],
    ['Puente', a.puente ? `${a.puente} mm` : undefined],
    ['Varilla', a.varilla ? `${a.varilla} mm` : undefined],
    ['Índice', a.indice ? String(a.indice) : undefined],
    ['Tratamiento', a.tratamiento],
  ];
  return filas.filter((f): f is [string, string] => Boolean(f[1]));
}

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
