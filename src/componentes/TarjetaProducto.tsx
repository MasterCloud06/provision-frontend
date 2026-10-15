import { Link } from 'react-router';
import type { Producto } from '../api/tipos';
import { bs, medidas, TIPOS } from '../util/formato';
import { ImagenProducto } from './ImagenProducto';

export function Disponibilidad({ disponible }: { disponible: number | null }) {
  if (disponible == null) return null;
  if (disponible === 0) return <span className="stock stock-agotado">Agotado</span>;
  if (disponible <= 3) return <span className="stock stock-pocos">Quedan {disponible}</span>;
  return null;
}

export function TarjetaProducto({ p }: { p: Producto }) {
  const m = medidas(p.atributos);
  return (
    <article className={`tarjeta-producto ${p.disponible === 0 ? 'agotado' : ''}`}>
      <Link to={`/productos/${p.id}`} className="tarjeta-enlace">
        <div className="tarjeta-imagen">
          <ImagenProducto url={p.imagenUrl} tipo={p.tipo} nombre={p.nombre} />
          <Disponibilidad disponible={p.disponible} />
        </div>
        <div className="tarjeta-texto">
          <p className="tarjeta-marca">{p.marca ?? TIPOS[p.tipo].uno}</p>
          <h3>{p.nombre}</h3>
          {m && <p className="tarjeta-medidas">{m}</p>}
          <p className="precio">{bs(p.precio)}</p>
        </div>
      </Link>
    </article>
  );
}
