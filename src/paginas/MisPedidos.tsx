import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { tienda } from '../api/tienda';
import type { PedidoResumen } from '../api/tipos';
import { Cargando, MensajeError, Vacio } from '../componentes/Basicos';
import { bs, ESTADOS, fecha, plural } from '../util/formato';

export function MisPedidos() {
  const [pedidos, setPedidos] = useState<PedidoResumen[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const cargar = () => {
    setError(null);
    tienda.pedidos().then(setPedidos).catch(setError);
  };
  useEffect(cargar, []);

  if (error) return <div className="contenedor"><MensajeError error={error} reintentar={cargar} /></div>;
  if (!pedidos) return <div className="contenedor"><Cargando texto="Cargando tus pedidos…" /></div>;

  return (
    <div className="contenedor angosto">
      <h1>Mis pedidos</h1>
      {pedidos.length === 0 ? (
        <Vacio titulo="Todavía no hiciste ningún pedido">
          <Link to="/catalogo" className="boton boton-primario">
            Ver el catálogo
          </Link>
        </Vacio>
      ) : (
        <ul className="lista-pedidos">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link to={`/pedidos/${p.id}`} className="fila-pedido">
                <span className="fila-pedido-numero">{p.numero}</span>
                <span className={`insignia insignia-${p.estado.toLowerCase()}`}>{ESTADOS[p.estado]}</span>
                <span className="texto-suave">
                  {fecha(p.creadoEn)}, {plural(p.unidades, 'producto', 'productos')}
                </span>
                <span className="fila-pedido-total">{bs(p.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
