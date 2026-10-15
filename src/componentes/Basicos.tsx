import { useEffect, useState, type ReactNode } from 'react';
import { ErrorApi } from '../api/cliente';

/** Indicador de carga. Si tarda, explica que el servidor puede estar despertando. */
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  const [lento, setLento] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLento(true), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="cargando" role="status">
      <span className="cargando-lente" aria-hidden="true" />
      <span>{texto}</span>
      {lento && <small>El servidor estaba en reposo y tarda hasta un minuto en despertar. Ya casi.</small>}
    </div>
  );
}

export function MensajeError({ error, reintentar }: { error: unknown; reintentar?: () => void }) {
  const texto = error instanceof Error ? error.message : 'Algo salió mal.';
  return (
    <div className="mensaje-error" role="alert">
      <p>{texto}</p>
      {reintentar && (
        <button type="button" className="boton boton-secundario" onClick={reintentar}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="vacio">
      <h2>{titulo}</h2>
      {children}
    </div>
  );
}

type PropsCampo = {
  etiqueta: string;
  nombre: string;
  error?: string;
  ayuda?: string;
  children?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

/** Campo de formulario con etiqueta, ayuda y error accesibles. */
export function Campo({ etiqueta, nombre, error, ayuda, children, ...input }: PropsCampo) {
  const idAyuda = ayuda ? `${nombre}-ayuda` : undefined;
  const idError = error ? `${nombre}-error` : undefined;
  return (
    <div className={`campo ${error ? 'con-error' : ''}`}>
      <label htmlFor={nombre}>{etiqueta}</label>
      {children ?? (
        <input id={nombre} name={nombre} aria-invalid={Boolean(error)} aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined} {...input} />
      )}
      {ayuda && !error && (
        <small id={idAyuda} className="campo-ayuda">
          {ayuda}
        </small>
      )}
      {error && (
        <small id={idError} className="campo-error">
          {error}
        </small>
      )}
    </div>
  );
}

/** Errores de campo de un ErrorApi, o {} si no aplica. */
export const erroresDe = (e: unknown) => (e instanceof ErrorApi ? e.campos : {});

/** Selector − n + para cantidades. */
export function Cantidad({ valor, max, onCambiar, deshabilitado, etiqueta = 'Cantidad' }: { valor: number; max: number | null; onCambiar: (n: number) => void; deshabilitado?: boolean; etiqueta?: string }) {
  const tope = Math.min(99, max ?? 99);
  return (
    <div className="cantidad" role="group" aria-label={etiqueta}>
      <button type="button" aria-label="Quitar uno" disabled={deshabilitado || valor <= 1} onClick={() => onCambiar(valor - 1)}>
        −
      </button>
      <output aria-live="polite">{valor}</output>
      <button type="button" aria-label="Agregar uno" disabled={deshabilitado || valor >= tope} onClick={() => onCambiar(valor + 1)}>
        +
      </button>
    </div>
  );
}
