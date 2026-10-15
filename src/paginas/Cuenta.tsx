import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { tienda } from '../api/tienda';
import { Campo, erroresDe, MensajeError } from '../componentes/Basicos';
import { useAvisos } from '../estado/Avisos';
import { useSesion } from '../estado/Sesion';
import { fecha } from '../util/formato';

function Datos() {
  const { cuenta, actualizar } = useSesion();
  const { avisar } = useAvisos();
  const c = cuenta!;
  const [d, setD] = useState({ nombre: c.nombre, telefono: c.telefono ?? '', direccion: c.direccion ?? '', ci: c.ci ?? '', nit: c.nit ?? '' });
  const [error, setError] = useState<unknown>(null);
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD((v) => ({ ...v, [k]: e.target.value }));
  const campos = erroresDe(error);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const vacio = (s: string) => s.trim() || null;
      actualizar(await tienda.actualizarCuenta({ nombre: d.nombre.trim(), telefono: vacio(d.telefono), direccion: vacio(d.direccion), ci: vacio(d.ci), nit: vacio(d.nit) }));
      avisar('Datos guardados');
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="formulario" noValidate>
      <h2>Tus datos</h2>
      <Campo etiqueta="Correo" nombre="email" value={c.email} readOnly ayuda="Es tu usuario para ingresar." />
      <Campo etiqueta="Nombre completo" nombre="nombre" autoComplete="name" value={d.nombre} onChange={set('nombre')} error={campos.nombre} />
      <Campo etiqueta="Teléfono o WhatsApp" nombre="telefono" type="tel" autoComplete="tel" value={d.telefono} onChange={set('telefono')} error={campos.telefono} />
      <Campo etiqueta="Dirección para envíos" nombre="direccion" autoComplete="street-address" value={d.direccion} onChange={set('direccion')} error={campos.direccion} />
      <div className="campos-fila">
        <Campo etiqueta="CI" nombre="ci" value={d.ci} onChange={set('ci')} error={campos.ci} />
        <Campo etiqueta="NIT (para tu factura)" nombre="nit" value={d.nit} onChange={set('nit')} error={campos.nit} />
      </div>
      {error != null && Object.keys(campos).length === 0 && <MensajeError error={error} />}
      <button type="submit" className="boton boton-primario" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}

function Contrasena() {
  const { avisar } = useAvisos();
  const [d, setD] = useState({ actual: '', nueva: '', repetir: '' });
  const [error, setError] = useState<unknown>(null);
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD((v) => ({ ...v, [k]: e.target.value }));
  const noCoinciden = d.repetir.length > 0 && d.repetir !== d.nueva;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await tienda.cambiarPassword(d.actual, d.nueva);
      setD({ actual: '', nueva: '', repetir: '' });
      avisar('Contraseña cambiada');
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="formulario">
      <h2>Cambiar contraseña</h2>
      <Campo etiqueta="Contraseña actual" nombre="actual" type="password" autoComplete="current-password" value={d.actual} onChange={set('actual')} />
      <Campo etiqueta="Nueva contraseña" nombre="nueva" type="password" autoComplete="new-password" minLength={8} value={d.nueva} onChange={set('nueva')} ayuda="Al menos 8 caracteres." />
      <Campo etiqueta="Repite la nueva contraseña" nombre="repetir" type="password" autoComplete="new-password" value={d.repetir} onChange={set('repetir')} error={noCoinciden ? 'Las contraseñas no coinciden' : undefined} />
      {error != null && <MensajeError error={error} />}
      <button type="submit" className="boton boton-secundario" disabled={guardando || noCoinciden || !d.actual || d.nueva.length < 8}>
        {guardando ? 'Cambiando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}

export function Cuenta() {
  const { cuenta, salir } = useSesion();
  const navegar = useNavigate();
  return (
    <div className="contenedor angosto">
      <div className="cuenta-cabecera">
        <div>
          <h1>Hola, {cuenta!.nombre.split(' ')[0]}</h1>
          <p className="texto-suave">Cliente desde el {fecha(cuenta!.creadoEn)}</p>
        </div>
        <div className="cuenta-acciones">
          <Link to="/pedidos" className="boton boton-secundario">
            Mis pedidos
          </Link>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => {
              salir();
              navegar('/');
            }}
          >
            Salir
          </button>
        </div>
      </div>
      <Datos />
      <Contrasena />
    </div>
  );
}
