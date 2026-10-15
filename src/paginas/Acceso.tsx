import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Campo, erroresDe, MensajeError } from '../componentes/Basicos';
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
      <p className="texto-suave">¿Olvidaste tu contraseña? Escríbenos o pasa por la óptica y te ayudamos a recuperarla.</p>
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
