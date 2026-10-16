import { pedir, qs } from './cliente';
import type { Cita, Disponibilidad, MotivoCita, Carrito, Cuenta, Entrega, InfoTienda, MetodoPago, Pagina, Pedido, PedidoResumen, Producto, ProductoDetalle, TipoProducto, Genero } from './tipos';

export type FiltrosCatalogo = {
  q?: string;
  tipo?: TipoProducto;
  marcaId?: string;
  genero?: Genero;
  precioMin?: number;
  precioMax?: number;
  disponibles?: boolean;
  orden?: 'nuevos' | 'precio_asc' | 'precio_desc' | 'nombre';
  pagina?: number;
  porPagina?: number;
};

export type DatosRegistro = { nombre: string; email: string; password: string; telefono?: string };
export type DatosPedido = {
  entrega: Entrega;
  metodoPago: MetodoPago;
  nombreContacto: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  notas?: string;
};
type Sesion = { token: string; cuenta: Cuenta };

export const tienda = {
  info: () => pedir<InfoTienda>('/tienda/info'),
  productos: (f: FiltrosCatalogo, señal?: AbortSignal) => pedir<Pagina<Producto>>(`/tienda/productos${qs(f)}`, { señal }),
  producto: (id: string) => pedir<ProductoDetalle>(`/tienda/productos/${id}`),

  registrarse: (d: DatosRegistro) => pedir<Sesion>('/tienda/auth/registro', { metodo: 'POST', cuerpo: d }),
  ingresar: (email: string, password: string) => pedir<Sesion>('/tienda/auth/login', { metodo: 'POST', cuerpo: { email, password } }),
  cuenta: () => pedir<Cuenta>('/tienda/cuenta'),
  actualizarCuenta: (d: Partial<Pick<Cuenta, 'nombre' | 'telefono' | 'ci' | 'nit' | 'direccion'>>) =>
    pedir<Cuenta>('/tienda/cuenta', { metodo: 'PATCH', cuerpo: d }),
  /** Devuelve un token nuevo: las sesiones de otros dispositivos se cierran. */
  cambiarPassword: (actual: string, nueva: string) => pedir<{ token: string }>('/tienda/cuenta/password', { metodo: 'POST', cuerpo: { actual, nueva } }),
  recuperar: (email: string) => pedir<{ mensaje: string }>('/tienda/auth/recuperar', { metodo: 'POST', cuerpo: { email } }),
  restablecer: (token: string, password: string) => pedir<Sesion>('/tienda/auth/restablecer', { metodo: 'POST', cuerpo: { token, password } }),

  carrito: () => pedir<Carrito>('/tienda/carrito'),
  fijarCantidad: (productoId: string, cantidad: number) => pedir<Carrito>(`/tienda/carrito/${productoId}`, { metodo: 'PUT', cuerpo: { cantidad } }),
  vaciarCarrito: () => pedir<Carrito>('/tienda/carrito', { metodo: 'DELETE' }),
  fusionarCarrito: (items: { productoId: string; cantidad: number }[]) =>
    pedir<Carrito>('/tienda/carrito/fusionar', { metodo: 'POST', cuerpo: { items } }),

  crearPedido: (d: DatosPedido) =>
    pedir<{ pedido: { id: string; numero: string }; urlPago: string | null }>('/tienda/pedidos', { metodo: 'POST', cuerpo: d }),
  pedidos: () => pedir<PedidoResumen[]>('/tienda/pedidos?porPagina=50'),
  pedido: (id: string) => pedir<Pedido>(`/tienda/pedidos/${id}`),
  verificarPago: (id: string) => pedir<Pedido>(`/tienda/pedidos/${id}/verificar`, { metodo: 'POST' }),
  pagar: (id: string) => pedir<{ urlPago: string }>(`/tienda/pedidos/${id}/pagar`, { metodo: 'POST' }),
  disponibilidad: (desde?: string, dias = 14) => pedir<Disponibilidad>(`/tienda/citas/disponibilidad${qs({ desde, dias })}`),
  citas: () => pedir<Cita[]>('/tienda/citas'),
  reservarCita: (d: { fecha: string; hora: string; motivo: MotivoCita; telefono: string; nombreContacto?: string; notas?: string }) =>
    pedir<Cita>('/tienda/citas', { metodo: 'POST', cuerpo: d }),
  cancelarCita: (id: string) => pedir<Cita>(`/tienda/citas/${id}/cancelar`, { metodo: 'POST' }),
  cancelar: (id: string) => pedir<Pedido>(`/tienda/pedidos/${id}/cancelar`, { metodo: 'POST' }),
};
