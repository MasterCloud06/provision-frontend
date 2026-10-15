import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Cantidad, Cargando, Vacio } from '../componentes/Basicos';
import { ImagenProducto } from '../componentes/ImagenProducto';
import { useAvisos } from '../estado/Avisos';
import { useCarrito } from '../estado/Carrito';
import { useInfo } from '../estado/Info';
import { useSesion } from '../estado/Sesion';
import { bs, plural } from '../util/formato';

export function Carrito() {
  const { carrito, cargando, fijar, quitar } = useCarrito();
  const { cuenta } = useSesion();
  const { info } = useInfo();
  const { avisar } = useAvisos();
  const navegar = useNavigate();
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cambiar = async (productoId: string, n: number) => {
    setOcupado(productoId);
    try {
      await (n <= 0 ? quitar(productoId) : fijar(productoId, n));
    } catch (e) {
      avisar((e as Error).message, { tipo: 'error' });
    } finally {
      setOcupado(null);
    }
  };

  if (cargando && carrito.items.length === 0) return <div className="contenedor"><Cargando texto="Cargando tu carrito…" /></div>;

  if (carrito.items.length === 0) {
    return (
      <div className="contenedor">
        <Vacio titulo="Tu carrito está vacío">
          <p>Agrega monturas, gafas o lo que necesites y aparecerán aquí.</p>
          <Link to="/catalogo" className="boton boton-primario">
            Ver el catálogo
          </Link>
        </Vacio>
      </div>
    );
  }

  const continuar = () => navegar(cuenta ? '/finalizar' : '/ingresar?volver=/finalizar');

  return (
    <div className="contenedor">
      <h1>Tu carrito</h1>
      <div className="dos-columnas">
        <ul className="lista-carrito">
          {carrito.items.map((i) => (
            <li key={i.productoId} className={`item-carrito ${i.problema ? 'con-problema' : ''}`}>
              <Link to={`/productos/${i.productoId}`} className="item-imagen" tabIndex={-1} aria-hidden="true">
                <ImagenProducto url={i.imagenUrl} tipo={i.tipo} nombre={i.nombre} />
              </Link>
              <div className="item-texto">
                {i.marca && <p className="tarjeta-marca">{i.marca}</p>}
                <Link to={`/productos/${i.productoId}`} className="item-nombre">
                  {i.nombre}
                </Link>
                <p className="texto-suave">{bs(i.precio)} c/u</p>
                {i.problema && <p className="item-problema">{i.problema}. Ajusta la cantidad o quítalo para continuar.</p>}
              </div>
              <div className="item-acciones">
                <Cantidad
                  valor={i.cantidad}
                  max={i.disponible != null ? Math.max(i.disponible, i.cantidad) : null}
                  onCambiar={(n) => cambiar(i.productoId, n)}
                  deshabilitado={ocupado === i.productoId}
                  etiqueta={`Cantidad de ${i.nombre}`}
                />
                <p className="item-subtotal">{bs(i.subtotal)}</p>
                <button type="button" className="enlace" onClick={() => cambiar(i.productoId, 0)} disabled={ocupado === i.productoId}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="resumen" aria-labelledby="titulo-resumen">
          <h2 id="titulo-resumen">Resumen</h2>
          <dl>
            <div>
              <dt>Productos ({plural(carrito.unidades, 'unidad', 'unidades')})</dt>
              <dd>{bs(carrito.subtotal)}</dd>
            </div>
            <div>
              <dt>Envío</dt>
              <dd>{info && info.costoEnvio > 0 ? `Gratis al retirar, ${bs(info.costoEnvio)} a domicilio` : 'Gratis'}</dd>
            </div>
          </dl>
          <button type="button" className="boton boton-primario boton-ancho" onClick={continuar} disabled={!carrito.listoParaPagar}>
            {cuenta ? 'Continuar con la compra' : 'Ingresar para comprar'}
          </button>
          {!cuenta && <p className="texto-suave">Tu carrito se guarda en tu cuenta al ingresar.</p>}
        </aside>
      </div>
    </div>
  );
}
