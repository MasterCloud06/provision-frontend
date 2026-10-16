/** Montos en centavos de boliviano (Bs 150,50 = 15050), igual que el backend. */
export type Centavos = number;

export type TipoProducto = 'MONTURA' | 'LENTE_OFTALMICO' | 'LENTE_CONTACTO' | 'GAFAS_SOL' | 'ACCESORIO' | 'LIQUIDO' | 'SERVICIO';
export type Genero = 'HOMBRE' | 'MUJER' | 'NINO' | 'UNISEX';

export type Atributos = {
  genero?: Genero;
  material?: string;
  forma?: string;
  color?: string;
  calibre?: number;
  puente?: number;
  varilla?: number;
  indice?: number;
  tratamiento?: string;
  [extra: string]: unknown;
};

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoProducto;
  marcaId: string | null;
  marca: string | null;
  modelo: string | null;
  atributos: Atributos;
  precio: Centavos;
  imagenUrl: string | null;
  /** Unidades a la venta; null = sin límite (servicios). */
  disponible: number | null;
  creadoEn: string;
};

export type ProductoDetalle = Producto & { relacionados: Producto[] };

export type Pagina<T> = { datos: T[]; total: number; pagina: number; porPagina: number };

export type InfoTienda = {
  sucursal: { nombre: string; direccion: string | null; telefono: string | null };
  costoEnvio: Centavos;
  pagoEnLinea: boolean;
  minutosReserva: number;
  diasRetiro: number;
  categorias: { tipo: TipoProducto; cantidad: number }[];
  marcas: { id: string; nombre: string; cantidad: number }[];
};

export type Cuenta = {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  ci: string | null;
  nit: string | null;
  direccion: string | null;
  creadoEn: string;
};

export type ItemCarrito = {
  productoId: string;
  cantidad: number;
  nombre: string;
  tipo: TipoProducto;
  marca: string | null;
  precio: Centavos;
  imagenUrl: string | null;
  disponible: number | null;
  subtotal: Centavos;
  /** Qué impide comprarlo ahora (null = todo bien). */
  problema: string | null;
};

export type Carrito = {
  items: ItemCarrito[];
  unidades: number;
  subtotal: Centavos;
  costoEnvio: Centavos;
  listoParaPagar: boolean;
};

export type EstadoPedido = 'PENDIENTE_PAGO' | 'PAGADO' | 'PREPARANDO' | 'LISTO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
export type Entrega = 'RETIRO' | 'ENVIO';
export type MetodoPago = 'STRIPE' | 'EN_TIENDA';

export type PedidoResumen = {
  id: string;
  numero: string;
  estado: EstadoPedido;
  metodoPago: MetodoPago;
  entrega: Entrega;
  total: Centavos;
  pagadoEn: string | null;
  expiraEn: string | null;
  creadoEn: string;
  unidades: number;
};

export type Pedido = {
  id: string;
  numero: string;
  estado: EstadoPedido;
  metodoPago: MetodoPago;
  entrega: Entrega;
  nombreContacto: string;
  telefono: string;
  direccion: string | null;
  ciudad: string | null;
  notas: string | null;
  subtotal: Centavos;
  costoEnvio: Centavos;
  total: Centavos;
  expiraEn: string | null;
  pagadoEn: string | null;
  canceladoMotivo: string | null;
  creadoEn: string;
  actualizadoEn: string;
  items: {
    id: string;
    productoId: string;
    nombre: string;
    precioUnitario: Centavos;
    cantidad: number;
    subtotal: Centavos;
    imagenUrl: string | null;
    tipo: TipoProducto;
  }[];
};

export type MotivoCita = 'EXAMEN_VISTA' | 'CONTROL' | 'LENTES_CONTACTO' | 'AJUSTE' | 'OTRO';
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'NO_ASISTIO' | 'CANCELADA';

export type DiaAgenda = { fecha: string; turnos: { hora: string; libre: boolean }[] };
export type Disponibilidad = { dias: DiaAgenda[]; duracion: number; motivos: Record<MotivoCita, string> };

export type Cita = {
  id: string;
  fecha: string;
  hora: string;
  duracion: number;
  motivo: MotivoCita;
  motivoTexto: string;
  estado: EstadoCita;
  nombreContacto: string;
  telefono: string;
  notas: string | null;
  canceladaMotivo: string | null;
  creadoEn: string;
};
