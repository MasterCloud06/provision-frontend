import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ErrorApi } from '../api/cliente';
import { tienda } from '../api/tienda';
import type { EstadoPedido, Pedido as TPedido } from '../api/tipos';
import { Cargando, MensajeError, Vacio } from '../componentes/Basicos';
import { ImagenProducto } from '../componentes/ImagenProducto';
import { useAvisos } from '../estado/Avisos';
import { useInfo } from '../estado/Info';
import { bs, diaHora, fecha, soloHora } from '../util/formato';

/** Los pasos que recorre el pedido, según cómo se paga y se entrega. */
function pasos(p: TPedido): { estado: EstadoPedido | 'RECIBIDO'; titulo: string }[] {
  const final = p.entrega === 'RETIRO' ? { estado: 'LISTO' as const, titulo: 'Listo para retirar' } : { estado: 'ENVIADO' as const, titulo: 'En camino' };
  const pago = p.metodoPago === 'STRIPE' ? [{ estado: 'PAGADO' as const, titulo: 'Pagado' }] : [];
  return [{ estado: 'RECIBIDO', titulo: 'Pedido recibido' }, ...pago, { estado: 'PREPARANDO', titulo: 'En preparación' }, final, { estado: 'ENTREGADO', titulo: 'Entregado' }];
}
const AVANCE: Record<EstadoPedido, number> = { PENDIENTE_PAGO: 0, PAGADO: 1, PREPARANDO: 2, LISTO: 3, ENVIADO: 3, ENTREGADO: 4, CANCELADO: -1 };

function Seguimiento({ p }: { p: TPedido }) {
  const lista = pasos(p);
  // Sin pago en línea no hay paso "Pagado": se corre un lugar.
  const actual = p.metodoPago === 'STRIPE' ? AVANCE[p.estado] : Math.max(0, AVANCE[p.estado] - 1);
  return (
    <ol className="seguimiento" aria-label="Estado del pedido">
      {lista.map((s, i) => (
        <li key={s.estado} className={i < actual ? 'hecho' : i === actual ? 'actual' : ''} aria-current={i === actual ? 'step' : undefined}>
          <span className="seguimiento-punto" aria-hidden="true" />
          <span>{s.titulo}</span>
        </li>
      ))}
    </ol>
  );
}

/** Mensaje principal: qué pasa con tu pedido y qué tienes que hacer. */
function Estado({ p, onPagar, onCancelar, ocupado }: { p: TPedido; onPagar: () => void; onCancelar: () => void; ocupado: boolean }) {
  const { info } = useInfo();
  const lugar = info?.sucursal.nombre ?? 'la óptica';
  const accionesPendiente = (
    <div className="estado-acciones">
      {p.metodoPago === 'STRIPE' && (
        <button type="button" className="boton boton-primario" onClick={onPagar} disabled={ocupado}>
          Pagar {bs(p.total)}
        </button>
      )}
      <button type="button" className="boton boton-secundario" onClick={onCancelar} disabled={ocupado}>
        Cancelar pedido
      </button>
    </div>
  );
  switch (p.estado) {
    case 'PENDIENTE_PAGO':
      return p.metodoPago === 'STRIPE' ? (
        <div className="estado estado-espera">
          <h2>Falta completar el pago</h2>
          <p>
            {p.expiraEn ? `Tus productos están reservados hasta las ${soloHora(p.expiraEn)}` : 'Tus productos están reservados'}. Si no se paga a
            tiempo, el pedido se cancela solo.
          </p>
          {accionesPendiente}
        </div>
      ) : (
        <div className="estado estado-ok">
          <h2>Pedido confirmado</h2>
          <p>
            Lo pagas al retirarlo en {lugar}. Te avisamos al {p.telefono} cuando esté listo.
            {p.expiraEn ? ` Lo guardamos hasta el ${fecha(p.expiraEn)}.` : ''}
          </p>
          {accionesPendiente}
        </div>
      );
    case 'PAGADO':
    case 'PREPARANDO':
      return (
        <div className="estado estado-ok">
          <h2>{p.estado === 'PAGADO' ? 'Pago recibido' : 'Estamos preparando tu pedido'}</h2>
          <p>Te avisamos al {p.telefono} cuando esté {p.entrega === 'RETIRO' ? 'listo para retirar' : 'en camino'}.</p>
        </div>
      );
    case 'LISTO':
      return (
        <div className="estado estado-ok">
          <h2>Tu pedido está listo</h2>
          <p>
            Pasa a retirarlo en {lugar}
            {info?.sucursal.direccion ? `, ${info.sucursal.direccion}` : ''}. Menciona el número {p.numero}
            {p.metodoPago === 'EN_TIENDA' && !p.pagadoEn ? ` y paga ${bs(p.total)} ahí mismo` : ''}.
          </p>
        </div>
      );
    case 'ENVIADO':
      return (
        <div className="estado estado-ok">
          <h2>Tu pedido va en camino</h2>
          <p>Llega a {p.direccion}. Si no estás, te llamamos al {p.telefono}.</p>
        </div>
      );
    case 'ENTREGADO':
      return (
        <div className="estado estado-ok">
          <h2>Pedido entregado</h2>
          <p>Gracias por tu compra.</p>
        </div>
      );
    case 'CANCELADO':
      return (
        <div className="estado estado-cancelado">
          <h2>Pedido cancelado</h2>
          <p>{p.canceladoMotivo ?? 'Este pedido se canceló.'} Los productos volvieron a estar a la venta.</p>
          <Link to="/catalogo" className="boton boton-secundario">
            Volver al catálogo
          </Link>
        </div>
      );
  }
}

export function Pedido() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { avisar } = useAvisos();
  const [p, setP] = useState<TPedido | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const pago = params.get('pago');
  const nuevo = params.get('nuevo') === '1';

  const cargar = useCallback(async () => {
    setError(null);
    try {
      // Al volver de Stripe se verifica el pago; si el aviso de Stripe tarda, se reintenta unos segundos.
      if (pago === 'exito') {
        let r = await tienda.verificarPago(id!);
        for (let i = 0; i < 4 && r.estado === 'PENDIENTE_PAGO'; i++) {
          setP(r);
          await new Promise((ok) => setTimeout(ok, 2500));
          r = await tienda.verificarPago(id!);
        }
        setP(r);
      } else {
        setP(await tienda.pedido(id!));
      }
    } catch (e) {
      setError(e);
    }
  }, [id, pago]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const pagar = async () => {
    setOcupado(true);
    try {
      const r = await tienda.pagar(p!.id);
      window.location.assign(r.urlPago);
    } catch (e) {
      avisar((e as Error).message, { tipo: 'error' });
      setOcupado(false);
      void cargar();
    }
  };
  const cancelar = async () => {
    if (!window.confirm('¿Cancelar este pedido? Los productos vuelven a estar a la venta.')) return;
    setOcupado(true);
    try {
      setP(await tienda.cancelar(p!.id));
      setParams({}, { replace: true });
      avisar('Pedido cancelado');
    } catch (e) {
      avisar((e as Error).message, { tipo: 'error' });
      void cargar();
    } finally {
      setOcupado(false);
    }
  };

  if (error instanceof ErrorApi && error.status === 404) {
    return (
      <div className="contenedor">
        <Vacio titulo="No encontramos ese pedido">
          <Link to="/pedidos" className="boton boton-primario">
            Ver mis pedidos
          </Link>
        </Vacio>
      </div>
    );
  }
  if (error) return <div className="contenedor"><MensajeError error={error} reintentar={cargar} /></div>;
  if (!p) return <div className="contenedor"><Cargando texto={pago === 'exito' ? 'Confirmando tu pago…' : 'Cargando tu pedido…'} /></div>;

  return (
    <div className="contenedor pedido">
      <nav className="migas" aria-label="Ruta">
        <Link to="/pedidos">Mis pedidos</Link>
      </nav>
      <div className="pedido-cabecera">
        <h1>Pedido {p.numero}</h1>
        <p className="texto-suave">
          Hecho el {diaHora(p.creadoEn)}
        </p>
      </div>

      {pago === 'cancelado' && p.estado === 'PENDIENTE_PAGO' && <p className="nota">No se completó el pago. Puedes intentarlo otra vez o cancelar el pedido.</p>}
      {nuevo && p.estado !== 'CANCELADO' && <p className="nota nota-ok">¡Listo! Recibimos tu pedido.</p>}

      <Estado p={p} onPagar={pagar} onCancelar={cancelar} ocupado={ocupado} />
      {p.estado !== 'CANCELADO' && <Seguimiento p={p} />}

      <div className="dos-columnas">
        <section aria-labelledby="titulo-productos">
          <h2 id="titulo-productos">Productos</h2>
          <ul className="lista-carrito">
            {p.items.map((i) => (
              <li key={i.id} className="item-carrito">
                <div className="item-imagen">
                  <ImagenProducto url={i.imagenUrl} tipo={i.tipo} nombre={i.nombre} />
                </div>
                <div className="item-texto">
                  <Link to={`/productos/${i.productoId}`} className="item-nombre">
                    {i.nombre}
                  </Link>
                  <p className="texto-suave">
                    {i.cantidad} × {bs(i.precioUnitario)}
                  </p>
                </div>
                <p className="item-subtotal">{bs(i.subtotal)}</p>
              </li>
            ))}
          </ul>
        </section>
        <aside className="resumen">
          <h2>Detalle</h2>
          <dl>
            <div>
              <dt>Productos</dt>
              <dd>{bs(p.subtotal)}</dd>
            </div>
            <div>
              <dt>Envío</dt>
              <dd>{p.costoEnvio ? bs(p.costoEnvio) : 'Gratis'}</dd>
            </div>
            <div className="resumen-total">
              <dt>Total</dt>
              <dd>{bs(p.total)}</dd>
            </div>
          </dl>
          <dl className="resumen-datos">
            <div>
              <dt>Entrega</dt>
              <dd>{p.entrega === 'RETIRO' ? 'Retiro en la óptica' : `${p.direccion}${p.ciudad ? `, ${p.ciudad}` : ''}`}</dd>
            </div>
            <div>
              <dt>Pago</dt>
              <dd>{p.metodoPago === 'STRIPE' ? 'Tarjeta' : 'Al retirar'}{p.pagadoEn ? `, pagado el ${diaHora(p.pagadoEn)}` : ''}</dd>
            </div>
            <div>
              <dt>Contacto</dt>
              <dd>
                {p.nombreContacto}, {p.telefono}
              </dd>
            </div>
            {p.notas && (
              <div>
                <dt>Notas</dt>
                <dd>{p.notas}</dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
