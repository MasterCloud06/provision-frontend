import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useCarrito } from '../estado/Carrito';
import { useSesion } from '../estado/Sesion';
import { useInfo } from '../estado/Info';

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Provisión, inicio">
      <svg viewBox="0 0 44 24" aria-hidden="true">
        <circle cx="11" cy="13" r="8" />
        <circle cx="33" cy="13" r="8" />
        <path d="M19 12q3-3 6 0" />
      </svg>
      <span>Provisión</span>
    </Link>
  );
}

function Buscador({ alBuscar }: { alBuscar?: () => void }) {
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  useEffect(() => setQ(params.get('q') ?? ''), [params]);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    navegar(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : '/catalogo');
    alBuscar?.();
  };
  return (
    <form className="buscador" role="search" onSubmit={enviar}>
      <label htmlFor="buscar" className="solo-lector">
        Buscar productos
      </label>
      <input id="buscar" type="search" placeholder="Busca por marca, modelo o tipo" value={q} onChange={(e) => setQ(e.target.value)} />
      <button type="submit" aria-label="Buscar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" />
        </svg>
      </button>
    </form>
  );
}

const SECCIONES = [
  { a: '/catalogo?tipo=MONTURA', texto: 'Monturas' },
  { a: '/catalogo?tipo=GAFAS_SOL', texto: 'Gafas de sol' },
  { a: '/catalogo?tipo=LENTE_CONTACTO', texto: 'Lentes de contacto' },
  { a: '/catalogo?tipo=LIQUIDO', texto: 'Soluciones' },
  { a: '/citas', texto: 'Reservar examen' },
];

function Encabezado() {
  const { carrito } = useCarrito();
  const { cuenta } = useSesion();
  const [menu, setMenu] = useState(false);
  const { pathname, search } = useLocation();
  useEffect(() => setMenu(false), [pathname, search]);

  return (
    <header className="encabezado">
      <div className="encabezado-fila contenedor">
        <Logo />
        <div className="encabezado-buscador">
          <Buscador />
        </div>
        <nav className="encabezado-acciones" aria-label="Tu cuenta">
          <NavLink to={cuenta ? '/cuenta' : '/ingresar'} className="accion">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" />
            </svg>
            <span>{cuenta ? cuenta.nombre.split(' ')[0] : 'Ingresar'}</span>
          </NavLink>
          <NavLink to="/carrito" className="accion accion-carrito">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2.5l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6.2" />
              <circle cx="10" cy="20.5" r="1.3" />
              <circle cx="17" cy="20.5" r="1.3" />
            </svg>
            <span>Carrito</span>
            {carrito.unidades > 0 && (
              <span className="contador" aria-label={`${carrito.unidades} en el carrito`}>
                {carrito.unidades}
              </span>
            )}
          </NavLink>
          <button type="button" className="accion boton-menu" aria-expanded={menu} aria-controls="secciones" onClick={() => setMenu((m) => !m)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={menu ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} />
            </svg>
            <span>Menú</span>
          </button>
        </nav>
      </div>
      <nav id="secciones" className={`secciones ${menu ? 'abierto' : ''}`} aria-label="Categorías">
        <div className="contenedor secciones-fila">
          <div className="secciones-buscador">
            <Buscador alBuscar={() => setMenu(false)} />
          </div>
          <NavLink to="/catalogo" end className="seccion">
            Todo
          </NavLink>
          {SECCIONES.map((s) => (
            <Link key={s.a} to={s.a} className={`seccion ${pathname + search === s.a ? 'activa' : ''}`}>
              {s.texto}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Pie() {
  const { info } = useInfo();
  const s = info?.sucursal;
  return (
    <footer className="pie">
      <div className="contenedor pie-columnas">
        <div>
          <Logo />
          <p>Monturas, lentes y todo para cuidar tu vista. Compra aquí y retira en la óptica, o recíbelo en casa.</p>
        </div>
        {s && (
          <div>
            <h2>Dónde retirar</h2>
            <p>
              {s.nombre}
              {s.direccion && (
                <>
                  <br />
                  {s.direccion}
                </>
              )}
              {s.telefono && (
                <>
                  <br />
                  <a href={`tel:${s.telefono.replace(/\s/g, '')}`}>{s.telefono}</a>
                </>
              )}
            </p>
          </div>
        )}
        <div>
          <h2>Tu compra</h2>
          <ul>
            <li>
              <Link to="/pedidos">Mis pedidos</Link>
            </li>
            <li>
              <Link to="/citas">Reservar examen de la vista</Link>
            </li>
            <li>
              <Link to="/cuenta">Mi cuenta</Link>
            </li>
            <li>
              <Link to="/ayuda">Cómo comprar</Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="contenedor pie-legal">
        Los pagos con tarjeta se procesan en la página segura de Stripe: Provisión nunca ve ni guarda los datos de tu tarjeta.
      </p>
    </footer>
  );
}

export function Marco() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <>
      <a href="#contenido" className="saltar">
        Ir al contenido
      </a>
      <Encabezado />
      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <Pie />
    </>
  );
}
