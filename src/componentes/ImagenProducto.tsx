import type { ReactElement } from "react";
import { useState } from 'react';
import type { TipoProducto } from '../api/tipos';

/** Dibujos de línea para los productos sin foto, uno por tipo. */
const DIBUJOS: Record<TipoProducto, ReactElement> = {
  MONTURA: (
    <g>
      <rect x="14" y="40" width="40" height="28" rx="12" />
      <rect x="66" y="40" width="40" height="28" rx="12" />
      <path d="M54 50q6-6 12 0M14 46l-8-4M106 46l8-4" />
    </g>
  ),
  GAFAS_SOL: (
    <g>
      <path d="M12 42h42v10c0 12-8 18-20 18s-22-6-22-18z" className="relleno" />
      <path d="M66 42h42v10c0 12-10 18-22 18s-20-6-20-18z" className="relleno" />
      <path d="M54 46q6-5 12 0M12 42l-6-4M108 42l6-4" />
    </g>
  ),
  LENTE_CONTACTO: (
    <g>
      <path d="M30 66c0-18 14-30 30-30s30 12 30 30" />
      <path d="M30 66q30 10 60 0" />
      <circle cx="60" cy="56" r="7" />
    </g>
  ),
  LENTE_OFTALMICO: (
    <g>
      <ellipse cx="60" cy="54" rx="34" ry="24" />
      <path d="M38 46q8-10 20-12" />
    </g>
  ),
  LIQUIDO: (
    <g>
      <path d="M48 30h24v8l6 8v36a6 6 0 0 1-6 6H48a6 6 0 0 1-6-6V46l6-8z" />
      <path d="M50 22h20v8H50zM42 60h36" />
    </g>
  ),
  ACCESORIO: (
    <g>
      <rect x="22" y="42" width="76" height="28" rx="14" />
      <path d="M22 56h76" />
    </g>
  ),
  SERVICIO: (
    <g>
      <path d="M14 56q46-40 92 0q-46 40-92 0z" />
      <circle cx="60" cy="56" r="12" />
      <circle cx="60" cy="56" r="4" className="relleno" />
    </g>
  ),
};

/** Versión reducida de una foto de Cloudinary (la genera al vuelo, en el formato más liviano para el navegador). */
export function miniatura(url: string, ancho: number) {
  return url.includes('res.cloudinary.com') && url.includes('/upload/') ? url.replace('/upload/', `/upload/c_limit,w_${ancho},f_auto,q_auto/`) : url;
}

export function ImagenProducto({
  url,
  tipo,
  nombre,
  className = '',
  ancho = 600,
}: {
  url: string | null;
  tipo: TipoProducto;
  nombre: string;
  className?: string;
  /** Ancho en píxeles que se pide a Cloudinary. */
  ancho?: number;
}) {
  const [fallo, setFallo] = useState(false);
  if (url && !fallo) {
    return <img className={`imagen-producto ${className}`} src={miniatura(url, ancho)} alt={nombre} loading="lazy" onError={() => setFallo(true)} />;
  }
  return (
    <div className={`imagen-producto sin-foto ${className}`} role="img" aria-label={nombre}>
      <svg viewBox="0 0 120 100" aria-hidden="true">
        {DIBUJOS[tipo]}
      </svg>
    </div>
  );
}
