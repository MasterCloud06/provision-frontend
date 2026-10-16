import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorApi } from '../api/cliente';
import { tienda } from '../api/tienda';
import type { ProductoDetalle } from '../api/tipos';
import { Cantidad, Cargando, MensajeError, Vacio } from '../componentes/Basicos';
import { ImagenProducto } from '../componentes/ImagenProducto';
import { TarjetaProducto } from '../componentes/TarjetaProducto';
import { useAvisos } from '../estado/Avisos';
import { useCarrito } from '../estado/Carrito';
import { useInfo } from '../estado/Info';
import { bs, fichaTecnica, medidas, TIPOS } from '../util/formato';

export function Producto() {
  const { id } = useParams();
  const { info } = useInfo();
  const { carrito, agregar } = useCarrito();
  const { avisar } = useAvisos();
  const [p, setP] = useState<ProductoDetalle | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);

  const cargar = () => {
    setError(null);
    setP(null);
    setCantidad(1);
    tienda.producto(id!).then(setP).catch(setError);
  };
  useEffect(cargar, [id]);

  if (error instanceof ErrorApi && error.status === 404) {
    return (
      <div className="contenedor">
        <Vacio titulo="Este producto ya no está disponible">
          <Link to="/catalogo" className="boton boton-primario">
            Ver el catálogo
          </Link>
        </Vacio>
      </div>
    );
  }
  if (error) return <div className="contenedor"><MensajeError error={error} reintentar={cargar} /></div>;
  if (!p) return <div className="contenedor"><Cargando /></div>;

  const enCarrito = carrito.items.find((i) => i.productoId === p.id)?.cantidad ?? 0;
  const quedan = p.disponible == null ? null : Math.max(0, p.disponible - enCarrito);
  const agotado = p.disponible === 0;
  const m = medidas(p.atributos);
  const ficha = fichaTecnica(p.atributos);

  const alAgregar = async () => {
    setAgregando(true);
    try {
      const total = await agregar(p, cantidad);
      if (total === enCarrito) avisar('Ya tienes en el carrito todas las unidades disponibles', { tipo: 'error', enlace: { a: '/carrito', texto: 'Ver carrito' } });
      else avisar(`${p.nombre} en tu carrito (${total})`, { enlace: { a: '/carrito', texto: 'Ver carrito' } });
      setCantidad(1);
    } catch (e) {
      avisar((e as Error).message, { tipo: 'error' });
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="contenedor">
      <nav className="migas" aria-label="Ruta">
        <Link to="/catalogo">Catálogo</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/catalogo?tipo=${p.tipo}`}>{TIPOS[p.tipo].varios}</Link>
      </nav>

      <div className="producto">
        <div className="producto-imagen">
          <ImagenProducto url={p.imagenUrl} tipo={p.tipo} nombre={p.nombre} ancho={1200} />
        </div>

        <div className="producto-info">
          {p.marca && <p className="producto-marca">{p.marca}</p>}
          <h1>{p.nombre}</h1>
          {p.modelo && <p className="texto-suave">Modelo {p.modelo}</p>}
          <p className="producto-precio">{bs(p.precio)}</p>

          {m && (
            <p className="producto-medidas">
              <span className="medidas-numeros">{m}</span>
              <span className="texto-suave">ancho del lente □ puente y varilla, en mm. Compáralo con las medidas impresas en el interior de tus lentes actuales.</span>
            </p>
          )}

          <div className="producto-compra">
            {agotado ? (
              <p className="stock stock-agotado">Agotado por ahora</p>
            ) : (
              <>
                <Cantidad valor={cantidad} max={quedan} onCambiar={setCantidad} deshabilitado={quedan === 0} />
                <button type="button" className="boton boton-primario" onClick={alAgregar} disabled={agregando || quedan === 0}>
                  {agregando ? 'Agregando…' : 'Agregar al carrito'}
                </button>
              </>
            )}
          </div>
          {p.disponible != null && p.disponible > 0 && (
            <p className="texto-suave">
              {p.disponible <= 3 ? `Quedan ${p.disponible}` : 'Disponible'}
              {enCarrito > 0 && ` · ya tienes ${enCarrito} en el carrito`}
            </p>
          )}

          {p.descripcion && <p className="producto-descripcion">{p.descripcion}</p>}

          {ficha.length > 0 && (
            <dl className="ficha">
              {ficha.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="producto-entrega">
            <p>
              <strong>Retiro en la óptica</strong> sin costo{info?.sucursal ? ` en ${info.sucursal.nombre}` : ''}.
            </p>
            <p>
              <strong>Envío a domicilio</strong>
              {info ? (info.costoEnvio > 0 ? ` por ${bs(info.costoEnvio)}` : ' sin costo') : ''}.
            </p>
            {p.tipo === 'MONTURA' && <p className="texto-suave">¿Necesitas lentes con tu graduación? Compra la montura y en la óptica te armamos los lentes con tu receta.</p>}
          </div>
        </div>
      </div>

      {p.relacionados.length > 0 && (
        <section className="bloque" aria-labelledby="titulo-relacionados">
          <h2 id="titulo-relacionados">También te puede gustar</h2>
          <div className="grilla-productos">
            {p.relacionados.map((r) => (
              <TarjetaProducto key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
