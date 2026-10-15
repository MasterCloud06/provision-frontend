import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { tienda } from '../api/tienda';
import type { Producto } from '../api/tipos';
import { Cargando, MensajeError } from '../componentes/Basicos';
import { ImagenProducto } from '../componentes/ImagenProducto';
import { TarjetaProducto } from '../componentes/TarjetaProducto';
import { useInfo } from '../estado/Info';
import { bs, ORDEN_TIPOS, plural, TIPOS } from '../util/formato';

/**
 * La portada es una cartilla de agudeza visual: cada fila más pequeña, con su valor decimal
 * al costado, como la que tienes enfrente en un examen de la vista.
 */
const FILAS = [
  { texto: 'VER', agudeza: '0,1' },
  { texto: 'BIEN', agudeza: '0,2' },
  { texto: 'TAMBIÉN SE', agudeza: '0,4' },
  { texto: 'VE BIEN', agudeza: '0,6' },
];

function Cartilla() {
  return (
    <section className="cartilla" aria-labelledby="titulo-portada">
      <h1 id="titulo-portada" className="cartilla-filas">
        {FILAS.map((f, i) => (
          <span key={f.texto} className={`cartilla-fila fila-${i + 1}`} style={{ animationDelay: `${120 + i * 140}ms` }}>
            <span className="cartilla-letras">{f.texto}</span>
            <span className="cartilla-agudeza" aria-hidden="true">
              {f.agudeza}
            </span>
          </span>
        ))}
      </h1>
      <div className="cartilla-fila fila-5" style={{ animationDelay: '700ms' }}>
        <p className="cartilla-letras">
          Monturas, gafas de sol y lentes de contacto. Compra en línea y retira en la óptica, o recíbelo en tu casa.
        </p>
        <span className="cartilla-agudeza" aria-hidden="true">
          1,0
        </span>
      </div>
      <div className="cartilla-acciones">
        <Link to="/catalogo?tipo=MONTURA" className="boton boton-primario">
          Ver monturas
        </Link>
        <Link to="/catalogo" className="boton boton-secundario">
          Todo el catálogo
        </Link>
      </div>
    </section>
  );
}

function Categorias() {
  const { info } = useInfo();
  if (!info?.categorias.length) return null;
  const porTipo = new Map(info.categorias.map((c) => [c.tipo, c.cantidad]));
  const tipos = ORDEN_TIPOS.filter((t) => porTipo.has(t));
  return (
    <section className="contenedor bloque" aria-labelledby="titulo-categorias">
      <h2 id="titulo-categorias">¿Qué necesitas?</h2>
      <ul className="categorias">
        {tipos.map((t) => (
          <li key={t}>
            <Link to={`/catalogo?tipo=${t}`} className="categoria">
              <ImagenProducto url={null} tipo={t} nombre="" />
              <span className="categoria-nombre">{TIPOS[t].varios}</span>
              <span className="categoria-cantidad">{plural(porTipo.get(t)!, 'producto', 'productos')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Novedades() {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const cargar = () => {
    setError(null);
    tienda
      .productos({ orden: 'nuevos', disponibles: true, porPagina: 8 })
      .then((r) => setProductos(r.datos))
      .catch(setError);
  };
  useEffect(cargar, []);

  return (
    <section className="contenedor bloque" aria-labelledby="titulo-novedades">
      <div className="bloque-titulo">
        <h2 id="titulo-novedades">Recién llegados</h2>
        <Link to="/catalogo">Ver todo el catálogo</Link>
      </div>
      {error ? (
        <MensajeError error={error} reintentar={cargar} />
      ) : !productos ? (
        <Cargando texto="Buscando lo más nuevo…" />
      ) : productos.length === 0 ? (
        <p className="texto-suave">Pronto vas a encontrar aquí nuestros productos.</p>
      ) : (
        <div className="grilla-productos">
          {productos.map((p) => (
            <TarjetaProducto key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function ComoComprar() {
  const { info } = useInfo();
  return (
    <section className="contenedor bloque como-comprar" aria-labelledby="titulo-como">
      <h2 id="titulo-como">Cómo comprar</h2>
      <ol className="pasos">
        <li>
          <h3>Elige</h3>
          <p>Busca por tipo, marca o medida, y agrega al carrito. Puedes armarlo sin cuenta.</p>
        </li>
        <li>
          <h3>Paga</h3>
          <p>
            {info?.pagoEnLinea
              ? 'Con tarjeta en la página segura de Stripe, o en la óptica cuando retires.'
              : 'En la óptica, cuando retires tu pedido. Te lo guardamos.'}
          </p>
        </li>
        <li>
          <h3>Recibe</h3>
          <p>
            Retíralo en {info?.sucursal.nombre ?? 'la óptica'} o te lo llevamos
            {info && info.costoEnvio > 0 ? ` por ${bs(info.costoEnvio)}` : ''}.
          </p>
        </li>
      </ol>
    </section>
  );
}

export function Inicio() {
  return (
    <>
      <div className="portada">
        <div className="contenedor">
          <Cartilla />
        </div>
      </div>
      <Categorias />
      <Novedades />
      <ComoComprar />
    </>
  );
}
