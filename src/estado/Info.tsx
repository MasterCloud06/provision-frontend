import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { tienda } from '../api/tienda';
import type { InfoTienda } from '../api/tipos';

type ValorInfo = { info: InfoTienda | null; error: unknown };
const Contexto = createContext<ValorInfo>({ info: null, error: null });

/** Datos generales de la tienda (sucursal, envío, si hay pago con tarjeta, categorías y marcas). */
export function ProveedorInfo({ children }: { children: ReactNode }) {
  const [valor, setValor] = useState<ValorInfo>({ info: null, error: null });
  useEffect(() => {
    tienda
      .info()
      .then((info) => setValor({ info, error: null }))
      .catch((error) => setValor({ info: null, error }));
  }, []);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useInfo = () => useContext(Contexto);
