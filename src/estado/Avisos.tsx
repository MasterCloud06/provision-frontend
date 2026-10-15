import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';

type Aviso = { id: number; texto: string; tipo: 'ok' | 'error'; enlace?: { a: string; texto: string } };
type ValorAvisos = { avisar: (texto: string, opciones?: { tipo?: Aviso['tipo']; enlace?: Aviso['enlace'] }) => void };

const Contexto = createContext<ValorAvisos | null>(null);

/** Mensajes breves abajo de la pantalla ("Agregado al carrito"). */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguiente = useRef(1);

  const quitar = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);
  const avisar = useCallback<ValorAvisos['avisar']>(
    (texto, opciones = {}) => {
      const id = siguiente.current++;
      setAvisos((a) => [...a.slice(-2), { id, texto, tipo: opciones.tipo ?? 'ok', enlace: opciones.enlace }]);
      setTimeout(() => quitar(id), opciones.tipo === 'error' ? 7000 : 4500);
    },
    [quitar],
  );
  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso aviso-${a.tipo}`}>
            <span>{a.texto}</span>
            {a.enlace && (
              <Link to={a.enlace.a} onClick={() => quitar(a.id)}>
                {a.enlace.texto}
              </Link>
            )}
            <button type="button" className="aviso-cerrar" aria-label="Cerrar aviso" onClick={() => quitar(a.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useAvisos() {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAvisos fuera de ProveedorAvisos');
  return v;
}
