import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { Cargando, Vacio } from '../componentes/Basicos';
import { useInfo } from '../estado/Info';
import { useSesion } from '../estado/Sesion';
import { bs, plural } from '../util/formato';

/** Páginas que necesitan sesión: si no la hay, lleva a ingresar y vuelve después. */
export function RequiereSesion() {
  const { cuenta, cargando } = useSesion();
  const { pathname, search } = useLocation();
  if (cargando) return <div className="contenedor"><Cargando /></div>;
  if (!cuenta) return <Navigate to={`/ingresar?volver=${encodeURIComponent(pathname + search)}`} replace />;
  return <Outlet />;
}

export function Ayuda() {
  const { info } = useInfo();
  return (
    <div className="contenedor angosto texto-largo">
      <h1>Cómo comprar</h1>
      <h2>Tu cuenta</h2>
      <p>Puedes mirar el catálogo y armar tu carrito sin cuenta. Para comprar, crea una con tu correo: ahí ves tus pedidos y cómo van.</p>
      <h2>Formas de pago</h2>
      <p>
        {info?.pagoEnLinea
          ? 'Con tarjeta de crédito o débito, en la página segura de Stripe. Provisión nunca ve ni guarda los datos de tu tarjeta. '
          : ''}
        Si retiras en la óptica, también puedes pagar ahí en efectivo, QR o tarjeta.
      </p>
      <h2>Retiro y envío</h2>
      <p>
        Retira sin costo en {info?.sucursal.nombre ?? 'la óptica'}
        {info?.sucursal.direccion ? `, ${info.sucursal.direccion}` : ''}. Si prefieres que te lo llevemos, el envío cuesta {info ? bs(info.costoEnvio) : '—'} y te llamamos para coordinar.
      </p>
      <h2>Reservas</h2>
      <p>
        Cuando confirmas, apartamos tus productos.
        {info ? ` Si pagas con tarjeta tienes ${info.minutosReserva} minutos para completar el pago; si pagas al retirar, te los guardamos ${plural(info.diasRetiro, 'día', 'días')}.` : ''} Pasado ese tiempo, el pedido se cancela solo.
      </p>
      <h2>Lentes con tu graduación</h2>
      <p>En línea vendemos monturas, gafas, lentes de contacto y accesorios. Para lentes con tu receta, compra la montura y pasa por la óptica: los armamos con tu graduación.</p>
      <h2>Cancelaciones</h2>
      <p>Puedes cancelar un pedido mientras no esté pagado, desde su página. Si ya lo pagaste, comunícate con la óptica{info?.sucursal.telefono ? ` al ${info.sucursal.telefono}` : ''} y te devolvemos el dinero a tu tarjeta.</p>
    </div>
  );
}

export function NoEncontrado() {
  return (
    <div className="contenedor">
      <Vacio titulo="Esta página no existe">
        <p>Puede que el enlace esté mal escrito o que la página se haya movido.</p>
        <Link to="/" className="boton boton-primario">
          Ir al inicio
        </Link>
      </Vacio>
    </div>
  );
}
