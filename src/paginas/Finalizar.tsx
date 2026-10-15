import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ErrorApi } from '../api/cliente';
import { tienda } from '../api/tienda';
import type { Entrega, MetodoPago } from '../api/tipos';
import { Campo, Cargando, erroresDe, MensajeError } from '../componentes/Basicos';
import { useCarrito } from '../estado/Carrito';
import { useInfo } from '../estado/Info';
import { useSesion } from '../estado/Sesion';
import { bs, plural } from '../util/formato';

export function Finalizar() {
  const { cuenta, actualizar } = useSesion();
  const { carrito, cargando, recargar } = useCarrito();
  const { info } = useInfo();
  const navegar = useNavigate();

  const [entrega, setEntrega] = useState<Entrega>('RETIRO');
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [datos, setDatos] = useState({
    nombreContacto: cuenta?.nombre ?? '',
    telefono: cuenta?.telefono ?? '',
    direccion: cuenta?.direccion ?? '',
    ciudad: '',
    notas: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (cargando || !info) return <div className="contenedor"><Cargando /></div>;
  if (carrito.items.length === 0 && !enviando) return <Navigate to="/carrito" replace />;

  const pagoEnLinea = info.pagoEnLinea;
  // Pagar al retirar solo se puede si retira; con envío solo queda la tarjeta.
  const metodoElegido: MetodoPago | null = entrega === 'ENVIO' ? (pagoEnLinea ? 'STRIPE' : null) : (metodo ?? (pagoEnLinea ? 'STRIPE' : 'EN_TIENDA'));
  const envio = entrega === 'ENVIO' ? info.costoEnvio : 0;
  const total = carrito.subtotal + envio;
  const campos = erroresDe(error);
  const set = (k: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDatos((d) => ({ ...d, [k]: e.target.value }));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!metodoElegido) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await tienda.crearPedido({
        entrega,
        metodoPago: metodoElegido,
        nombreContacto: datos.nombreContacto.trim(),
        telefono: datos.telefono.trim(),
        ...(entrega === 'ENVIO' ? { direccion: datos.direccion.trim(), ciudad: datos.ciudad.trim() || undefined } : {}),
        notas: datos.notas.trim() || undefined,
      });
      // Guarda en su cuenta lo que faltaba, para la próxima compra.
      if (cuenta && (!cuenta.telefono || (entrega === 'ENVIO' && !cuenta.direccion))) {
        tienda
          .actualizarCuenta({ telefono: cuenta.telefono || datos.telefono.trim(), ...(entrega === 'ENVIO' && !cuenta.direccion ? { direccion: datos.direccion.trim() } : {}) })
          .then(actualizar)
          .catch(() => undefined);
      }
      if (r.urlPago) {
        window.location.assign(r.urlPago);
        return;
      }
      await recargar().catch(() => undefined);
      navegar(`/pedidos/${r.pedido.id}?nuevo=1`, { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
      if (err instanceof ErrorApi && err.status === 422) recargar().catch(() => undefined);
    }
  };

  return (
    <div className="contenedor">
      <h1>Finalizar compra</h1>
      <form className="dos-columnas" onSubmit={enviar} noValidate>
        <div className="finalizar-pasos">
          <fieldset className="grupo">
            <legend>¿Cómo lo recibes?</legend>
            <div className="opciones-grandes">
              <label className={`opcion-grande ${entrega === 'RETIRO' ? 'elegida' : ''}`}>
                <input type="radio" name="entrega" value="RETIRO" checked={entrega === 'RETIRO'} onChange={() => setEntrega('RETIRO')} />
                <span className="opcion-titulo">Retiro en la óptica</span>
                <span className="opcion-detalle">
                  Sin costo. {info.sucursal.nombre}
                  {info.sucursal.direccion ? `, ${info.sucursal.direccion}` : ''}
                </span>
              </label>
              <label className={`opcion-grande ${entrega === 'ENVIO' ? 'elegida' : ''}`}>
                <input type="radio" name="entrega" value="ENVIO" checked={entrega === 'ENVIO'} onChange={() => setEntrega('ENVIO')} />
                <span className="opcion-titulo">Envío a domicilio</span>
                <span className="opcion-detalle">{info.costoEnvio > 0 ? bs(info.costoEnvio) : 'Sin costo'}. Te llamamos para coordinar la entrega.</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="grupo">
            <legend>Tus datos</legend>
            <Campo etiqueta="Nombre de quien recibe" nombre="nombreContacto" autoComplete="name" required value={datos.nombreContacto} onChange={set('nombreContacto')} error={campos.nombreContacto} />
            <Campo etiqueta="Teléfono o WhatsApp" nombre="telefono" type="tel" autoComplete="tel" inputMode="tel" required value={datos.telefono} onChange={set('telefono')} error={campos.telefono} ayuda="Te avisamos por aquí cuando tu pedido esté listo." />
            {entrega === 'ENVIO' && (
              <>
                <Campo etiqueta="Dirección" nombre="direccion" autoComplete="street-address" required value={datos.direccion} onChange={set('direccion')} error={campos.direccion} ayuda="Calle, número, zona y una referencia." />
                <Campo etiqueta="Ciudad" nombre="ciudad" autoComplete="address-level2" value={datos.ciudad} onChange={set('ciudad')} error={campos.ciudad} />
              </>
            )}
            <Campo etiqueta="Notas para la óptica (opcional)" nombre="notas" error={campos.notas}>
              <textarea id="notas" name="notas" rows={2} maxLength={500} value={datos.notas} onChange={set('notas')} />
            </Campo>
          </fieldset>

          <fieldset className="grupo">
            <legend>¿Cómo pagas?</legend>
            <div className="opciones-grandes">
              <label className={`opcion-grande ${metodoElegido === 'STRIPE' ? 'elegida' : ''} ${!pagoEnLinea ? 'deshabilitada' : ''}`}>
                <input type="radio" name="metodo" value="STRIPE" disabled={!pagoEnLinea} checked={metodoElegido === 'STRIPE'} onChange={() => setMetodo('STRIPE')} />
                <span className="opcion-titulo">Tarjeta de crédito o débito</span>
                <span className="opcion-detalle">
                  {pagoEnLinea ? 'Pagas en la página segura de Stripe y vuelves aquí.' : 'Todavía no disponible.'}
                </span>
              </label>
              <label className={`opcion-grande ${metodoElegido === 'EN_TIENDA' ? 'elegida' : ''} ${entrega === 'ENVIO' ? 'deshabilitada' : ''}`}>
                <input type="radio" name="metodo" value="EN_TIENDA" disabled={entrega === 'ENVIO'} checked={metodoElegido === 'EN_TIENDA'} onChange={() => setMetodo('EN_TIENDA')} />
                <span className="opcion-titulo">Pagar al retirar</span>
                <span className="opcion-detalle">
                  {entrega === 'ENVIO' ? 'Solo si retiras en la óptica.' : `Efectivo, QR o tarjeta en la óptica. Te lo guardamos ${plural(info.diasRetiro, 'día', 'días')}.`}
                </span>
              </label>
            </div>
            {!metodoElegido && <p className="campo-error">El envío a domicilio necesita pago con tarjeta, que aún no está disponible. Elige retiro en la óptica.</p>}
          </fieldset>
        </div>

        <aside className="resumen" aria-labelledby="titulo-resumen">
          <h2 id="titulo-resumen">Tu pedido</h2>
          <ul className="resumen-items">
            {carrito.items.map((i) => (
              <li key={i.productoId}>
                <span>
                  {i.cantidad} × {i.nombre}
                </span>
                <span>{bs(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div>
              <dt>Productos</dt>
              <dd>{bs(carrito.subtotal)}</dd>
            </div>
            <div>
              <dt>Envío</dt>
              <dd>{envio ? bs(envio) : 'Gratis'}</dd>
            </div>
            <div className="resumen-total">
              <dt>Total</dt>
              <dd>{bs(total)}</dd>
            </div>
          </dl>
          {error != null && Object.keys(campos).length === 0 && <MensajeError error={error} />}
          {!carrito.listoParaPagar && (
            <p className="campo-error">
              Hay productos sin stock suficiente. <Link to="/carrito">Revisa tu carrito</Link>.
            </p>
          )}
          <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando || !metodoElegido || !carrito.listoParaPagar}>
            {enviando ? 'Procesando…' : metodoElegido === 'STRIPE' ? `Pagar ${bs(total)} con tarjeta` : 'Confirmar pedido'}
          </button>
          <p className="texto-suave">
            {metodoElegido === 'STRIPE'
              ? `Te llevamos a Stripe para pagar. Reservamos tus productos ${info.minutosReserva} minutos.`
              : 'Reservamos tus productos y te avisamos cuando estén listos.'}
          </p>
        </aside>
      </form>
    </div>
  );
}
