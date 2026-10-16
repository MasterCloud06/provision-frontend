import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { ErrorApi } from '../api/cliente';
import { tienda } from '../api/tienda';
import { Campo, erroresDe, MensajeError } from '../componentes/Basicos';
import { useInfo } from '../estado/Info';
import { useSesion } from '../estado/Sesion';

/** Solo rutas internas: evita que ?volver= lleve a otro sitio. */
function destino(params: URLSearchParams) {
  const v = params.get('volver') ?? '/';
  return v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

export function Ingresar() {
  const { cuenta, ingresar } = useSesion();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const volver = destino(params);

  if (cuenta && !enviando) return <Navigate to={volver} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await ingresar(email.trim(), password);
      navegar(volver, { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <div className="contenedor acceso">
      <h1>Ingresa a tu cuenta</h1>
      <p className="texto-suave">Para comprar y seguir tus pedidos. Tu carrito se guarda en tu cuenta.</p>
      <form onSubmit={enviar} className="formulario">
        <Campo etiqueta="Correo" nombre="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Campo etiqueta="Contraseña" nombre="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error != null && <MensajeError error={error} />}
        <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando || !email || !password}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p>
        ¿Primera vez? <Link to={`/registrarse${volver !== '/' ? `?volver=${encodeURIComponent(volver)}` : ''}`}>Crea tu cuenta</Link>
      </p>
      <p>
        <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
      </p>
    </div>
  );
}

export function Registrarse() {
  const { cuenta, registrarse } = useSesion();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [d, setD] = useState({ nombre: '', email: '', telefono: '', password: '', repetir: '' });
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const volver = destino(params);

  if (cuenta && !enviando) return <Navigate to={volver} replace />;

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD((v) => ({ ...v, [k]: e.target.value }));
  const noCoinciden = d.repetir.length > 0 && d.repetir !== d.password;
  const campos = erroresDe(error);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (noCoinciden) return;
    setEnviando(true);
    setError(null);
    try {
      await registrarse({ nombre: d.nombre.trim(), email: d.email.trim(), password: d.password, telefono: d.telefono.trim() || undefined });
      navegar(volver, { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <div className="contenedor acceso">
      <h1>Crea tu cuenta</h1>
      <p className="texto-suave">Así puedes comprar, pagar en línea y ver el estado de tus pedidos.</p>
      <form onSubmit={enviar} className="formulario" noValidate>
        <Campo etiqueta="Nombre completo" nombre="nombre" autoComplete="name" required value={d.nombre} onChange={set('nombre')} error={campos.nombre} />
        <Campo etiqueta="Correo" nombre="email" type="email" autoComplete="email" required value={d.email} onChange={set('email')} error={campos.email} />
        <Campo etiqueta="Teléfono o WhatsApp (opcional)" nombre="telefono" type="tel" autoComplete="tel" value={d.telefono} onChange={set('telefono')} error={campos.telefono} ayuda="Para avisarte cuando tu pedido esté listo." />
        <Campo etiqueta="Contraseña" nombre="password" type="password" autoComplete="new-password" required minLength={8} value={d.password} onChange={set('password')} error={campos.password} ayuda="Al menos 8 caracteres." />
        <Campo etiqueta="Repite la contraseña" nombre="repetir" type="password" autoComplete="new-password" required value={d.repetir} onChange={set('repetir')} error={noCoinciden ? 'Las contraseñas no coinciden' : undefined} />
        {error != null && Object.keys(campos).length === 0 && <MensajeError error={error} />}
        <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando || noCoinciden || !d.nombre || !d.email || d.password.length < 8}>
          {enviando ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p>
        ¿Ya tienes cuenta? <Link to={`/ingresar${volver !== '/' ? `?volver=${encodeURIComponent(volver)}` : ''}`}>Ingresa</Link>
      </p>
    </div>
  );
}

/** Pide el enlace para crear una contraseña nueva. */
export function Recuperar() {
  const { info } = useInfo();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  if (info && info.recuperacionPorCorreo === false) {
    return (
      <div className="contenedor acceso">
        <h1>Recuperar tu contraseña</h1>
        <p>
          Por ahora la recuperación se hace en la óptica. Escríbenos o llámanos
          {info.sucursal.telefono ? ` al ${info.sucursal.telefono}` : ''} y te ayudamos a entrar de nuevo.
        </p>
        <Link to="/ingresar">Volver a ingresar</Link>
      </div>
    );
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      setEnviado((await tienda.recuperar(email.trim())).mensaje);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="contenedor acceso">
      <h1>Recuperar tu contraseña</h1>
      {enviado ? (
        <>
          <div className="estado estado-ok" role="status">
            <p>{enviado}</p>
          </div>
          <p className="texto-suave">El enlace vence en 1 hora. ¿No llegó? Espera un par de minutos y vuelve a pedirlo.</p>
          <button type="button" className="enlace" onClick={() => setEnviado(null)}>
            Pedir otro enlace
          </button>
        </>
      ) : (
        <>
          <p className="texto-suave">Escribe el correo de tu cuenta y te enviamos un enlace para crear una contraseña nueva.</p>
          <form onSubmit={enviar} className="formulario">
            <Campo etiqueta="Correo" nombre="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={erroresDe(error).email} />
            {error != null && !erroresDe(error).email && <MensajeError error={error} />}
            <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando || !email.includes('@')}>
              {enviando ? 'Enviando…' : 'Enviarme el enlace'}
            </button>
          </form>
        </>
      )}
      <p>
        <Link to="/ingresar">Volver a ingresar</Link>
      </p>
    </div>
  );
}

/** Crea la contraseña nueva desde el enlace del correo. */
export function Restablecer() {
  const { entrarCon } = useSesion();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const tk = params.get('token') ?? '';
  const [d, setD] = useState({ password: '', repetir: '' });
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const noCoinciden = d.repetir.length > 0 && d.repetir !== d.password;
  const vencido = error instanceof ErrorApi && error.codigo === 'ENLACE_INVALIDO';

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (noCoinciden) return;
    setEnviando(true);
    setError(null);
    try {
      const s = await tienda.restablecer(tk, d.password);
      entrarCon(s.token, s.cuenta);
      navegar('/cuenta', { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  if (!tk || vencido) {
    return (
      <div className="contenedor acceso">
        <h1>El enlace ya no sirve</h1>
        <p>Los enlaces sirven una sola vez y vencen en 1 hora. Pide uno nuevo y úsalo apenas te llegue.</p>
        <Link to="/recuperar" className="boton boton-primario">
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }

  return (
    <div className="contenedor acceso">
      <h1>Crea tu contraseña nueva</h1>
      <p className="texto-suave">Al guardarla entras a tu cuenta, y se cierra la sesión en cualquier otro dispositivo.</p>
      <form onSubmit={enviar} className="formulario">
        <Campo etiqueta="Contraseña nueva" nombre="password" type="password" autoComplete="new-password" minLength={8} required value={d.password} onChange={(e) => setD((v) => ({ ...v, password: e.target.value }))} error={erroresDe(error).password} ayuda="Al menos 8 caracteres." />
        <Campo etiqueta="Repite la contraseña" nombre="repetir" type="password" autoComplete="new-password" required value={d.repetir} onChange={(e) => setD((v) => ({ ...v, repetir: e.target.value }))} error={noCoinciden ? 'Las contraseñas no coinciden' : undefined} />
        {error != null && !erroresDe(error).password && <MensajeError error={error} />}
        <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando || noCoinciden || d.password.length < 8}>
          {enviando ? 'Guardando…' : 'Guardar y entrar'}
        </button>
      </form>
    </div>
  );
}
