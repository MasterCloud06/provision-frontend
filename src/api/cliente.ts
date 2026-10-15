/** Dirección de la API. Se define en .env.development / .env.production (VITE_API_URL). */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/+$/, '');

const CLAVE_TOKEN = 'provision.token';

export const token = {
  leer(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(valor: string | null) {
    try {
      if (valor) localStorage.setItem(CLAVE_TOKEN, valor);
      else localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* navegación privada: la sesión dura lo que la pestaña */
    }
  },
};

/** Error de la API con el mensaje listo para mostrar. */
export class ErrorApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
  }

  /** Errores de validación por campo (`{ fieldErrors: { email: ['...'] } }`). */
  get campos(): Record<string, string> {
    const f = (this.detalles as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors ?? {};
    return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v[0] ?? '']));
  }
}

/** Avisa cuando la sesión venció, para cerrarla en toda la app. */
let alVencerSesion: (() => void) | null = null;
export const escucharSesionVencida = (fn: (() => void) | null) => {
  alVencerSesion = fn;
};

type Opciones = { metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; cuerpo?: unknown; señal?: AbortSignal };

export async function pedir<T>(ruta: string, { metodo = 'GET', cuerpo, señal }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const tk = token.leer();
  if (tk) headers.Authorization = `Bearer ${tk}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: señal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ErrorApi(0, 'SIN_CONEXION', 'No hay conexión con la tienda. Revisa tu internet e intenta de nuevo.');
  }

  if (res.status === 204) return undefined as T;
  const datos = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (datos as { error?: { codigo?: string; mensaje?: string; detalles?: unknown } } | null)?.error;
    if (res.status === 401 && tk && !ruta.startsWith('/tienda/auth/')) alVencerSesion?.();
    throw new ErrorApi(
      res.status,
      e?.codigo ?? 'ERROR',
      res.status === 400 && e?.codigo === 'VALIDACION' ? 'Revisa los datos marcados.' : (e?.mensaje ?? `Error ${res.status}`),
      e?.detalles,
    );
  }
  return datos as T;
}

/** Arma una query string ignorando lo vacío. */
export function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}
