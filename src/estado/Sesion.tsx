import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { escucharSesionVencida, token } from '../api/cliente';
import { tienda, type DatosRegistro } from '../api/tienda';
import type { Cuenta } from '../api/tipos';

type ValorSesion = {
  cuenta: Cuenta | null;
  /** true mientras se recupera la sesión guardada al abrir la página. */
  cargando: boolean;
  ingresar: (email: string, password: string) => Promise<Cuenta>;
  registrarse: (d: DatosRegistro) => Promise<Cuenta>;
  salir: () => void;
  actualizar: (c: Cuenta) => void;
  /** Inicia la sesión con un token ya emitido (p. ej. al crear una contraseña nueva). */
  entrarCon: (tk: string, c: Cuenta) => void;
};

const Contexto = createContext<ValorSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [cargando, setCargando] = useState(() => token.leer() != null);

  const salir = useCallback(() => {
    token.guardar(null);
    setCuenta(null);
  }, []);

  useEffect(() => {
    escucharSesionVencida(salir);
    if (!token.leer()) return;
    tienda
      .cuenta()
      .then(setCuenta)
      .catch(() => salir())
      .finally(() => setCargando(false));
    return () => escucharSesionVencida(null);
  }, [salir]);

  const valor = useMemo<ValorSesion>(
    () => ({
      cuenta,
      cargando,
      salir,
      actualizar: setCuenta,
      entrarCon(tk, c) {
        token.guardar(tk);
        setCuenta(c);
      },
      async ingresar(email, password) {
        const s = await tienda.ingresar(email, password);
        token.guardar(s.token);
        setCuenta(s.cuenta);
        return s.cuenta;
      },
      async registrarse(d) {
        const s = await tienda.registrarse(d);
        token.guardar(s.token);
        setCuenta(s.cuenta);
        return s.cuenta;
      },
    }),
    [cuenta, cargando, salir],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const v = useContext(Contexto);
  if (!v) throw new Error('useSesion fuera de ProveedorSesion');
  return v;
}
