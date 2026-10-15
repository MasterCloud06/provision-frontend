import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { tienda } from '../api/tienda';
import type { Carrito, ItemCarrito, Producto } from '../api/tipos';
import { useSesion } from './Sesion';

const CLAVE = 'provision.carrito';
const VACIO: Carrito = { items: [], unidades: 0, subtotal: 0, costoEnvio: 0, listoParaPagar: false };

/** Carrito del visitante sin sesión: vive en el navegador y se junta con su cuenta al ingresar. */
function leerLocal(): ItemCarrito[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function guardarLocal(items: ItemCarrito[]) {
  try {
    if (items.length) localStorage.setItem(CLAVE, JSON.stringify(items));
    else localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: el carrito dura lo que la pestaña */
  }
}
function resumir(items: ItemCarrito[], costoEnvio = 0): Carrito {
  const conProblema = items.map((i) => ({
    ...i,
    subtotal: i.precio * i.cantidad,
    problema: i.disponible != null && i.disponible < i.cantidad ? (i.disponible === 0 ? 'Agotado' : `Solo quedan ${i.disponible}`) : null,
  }));
  return {
    items: conProblema,
    unidades: conProblema.reduce((a, i) => a + i.cantidad, 0),
    subtotal: conProblema.reduce((a, i) => a + i.subtotal, 0),
    costoEnvio,
    listoParaPagar: conProblema.length > 0 && conProblema.every((i) => !i.problema),
  };
}

type ValorCarrito = {
  carrito: Carrito;
  cargando: boolean;
  /** Suma unidades de un producto. Devuelve la cantidad final en el carrito. */
  agregar: (p: Producto, cantidad?: number) => Promise<number>;
  fijar: (productoId: string, cantidad: number) => Promise<void>;
  quitar: (productoId: string) => Promise<void>;
  recargar: () => Promise<void>;
};

const Contexto = createContext<ValorCarrito | null>(null);

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const { cuenta, cargando: cargandoSesion } = useSesion();
  const [carrito, setCarrito] = useState<Carrito>(() => resumir(leerLocal()));
  const [cargando, setCargando] = useState(false);
  const local = useRef<ItemCarrito[]>(leerLocal());

  const conSesion = cuenta != null;

  const recargar = useCallback(async () => {
    if (!conSesion) {
      setCarrito(resumir(local.current));
      return;
    }
    setCarrito(await tienda.carrito());
  }, [conSesion]);

  // Al ingresar: lo que armó como visitante pasa a su cuenta.
  useEffect(() => {
    if (cargandoSesion) return;
    if (!conSesion) {
      setCarrito(resumir(local.current));
      return;
    }
    let vigente = true;
    setCargando(true);
    const pendientes = local.current.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
    const p = pendientes.length ? tienda.fusionarCarrito(pendientes) : tienda.carrito();
    p.then((c) => {
      if (!vigente) return;
      local.current = [];
      guardarLocal([]);
      setCarrito(c);
    })
      .catch(() => undefined)
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [conSesion, cargandoSesion]);

  const fijarLocal = (items: ItemCarrito[]) => {
    local.current = items;
    guardarLocal(items);
    setCarrito(resumir(items));
  };

  const agregar = useCallback<ValorCarrito['agregar']>(
    async (p, cantidad = 1) => {
      const actual = (conSesion ? carrito.items : local.current).find((i) => i.productoId === p.id)?.cantidad ?? 0;
      let total = Math.min(99, actual + cantidad);
      if (p.disponible != null) total = Math.min(total, p.disponible);
      if (total <= actual) return actual;
      if (conSesion) {
        setCarrito(await tienda.fijarCantidad(p.id, total));
      } else {
        const item: ItemCarrito = {
          productoId: p.id,
          cantidad: total,
          nombre: p.nombre,
          tipo: p.tipo,
          marca: p.marca,
          precio: p.precio,
          imagenUrl: p.imagenUrl,
          disponible: p.disponible,
          subtotal: 0,
          problema: null,
        };
        const otros = local.current.filter((i) => i.productoId !== p.id);
        fijarLocal(actual ? local.current.map((i) => (i.productoId === p.id ? item : i)) : [...otros, item]);
      }
      return total;
    },
    [conSesion, carrito.items],
  );

  const fijar = useCallback<ValorCarrito['fijar']>(
    async (productoId, cantidad) => {
      if (conSesion) {
        setCarrito(await tienda.fijarCantidad(productoId, cantidad));
        return;
      }
      fijarLocal(
        cantidad <= 0
          ? local.current.filter((i) => i.productoId !== productoId)
          : local.current.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)),
      );
    },
    [conSesion],
  );

  const quitar = useCallback((productoId: string) => fijar(productoId, 0), [fijar]);

  const valor = useMemo(
    () => ({ carrito: conSesion ? carrito : carrito.items.length ? carrito : VACIO, cargando, agregar, fijar, quitar, recargar }),
    [carrito, cargando, agregar, fijar, quitar, recargar, conSesion],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito() {
  const v = useContext(Contexto);
  if (!v) throw new Error('useCarrito fuera de ProveedorCarrito');
  return v;
}
