import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { tienda } from '../api/tienda';
import type { Cita, Disponibilidad, MotivoCita } from '../api/tipos';
import { Campo, Cargando, erroresDe, MensajeError } from '../componentes/Basicos';
import { useAvisos } from '../estado/Avisos';
import { useInfo } from '../estado/Info';
import { useSesion } from '../estado/Sesion';

const diaCorto = new Intl.DateTimeFormat('es-BO', { weekday: 'short', timeZone: 'UTC' });
const diaLargo = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const mesCorto = new Intl.DateTimeFormat('es-BO', { month: 'short', timeZone: 'UTC' });
const fechaUtc = (f: string) => new Date(`${f}T12:00:00Z`);
export const fechaCita = (f: string) => diaLargo.format(fechaUtc(f));

const ESTADOS: Record<Cita['estado'], string> = {
  PENDIENTE: 'Reservada',
  CONFIRMADA: 'Confirmada',
  ATENDIDA: 'Atendida',
  NO_ASISTIO: 'No asististe',
  CANCELADA: 'Cancelada',
};

function MisCitas({ citas, alCancelar }: { citas: Cita[]; alCancelar: (c: Cita) => void }) {
  if (citas.length === 0) return null;
  return (
    <section className="bloque" aria-labelledby="titulo-mis-citas">
      <h2 id="titulo-mis-citas">Tus citas</h2>
      <ul className="lista-pedidos">
        {citas.map((c) => {
          const activa = c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA';
          return (
            <li key={c.id} className="fila-cita">
              <div>
                <p className="fila-pedido-numero">
                  {fechaCita(c.fecha)}, {c.hora}
                </p>
                <p className="texto-suave">
                  {c.motivoTexto}
                  {c.canceladaMotivo ? `. ${c.canceladaMotivo}` : ''}
                </p>
              </div>
              <span className={`insignia insignia-${activa ? 'pagado' : c.estado === 'CANCELADA' ? 'cancelado' : 'entregado'}`}>{ESTADOS[c.estado]}</span>
              {activa && (
                <button type="button" className="enlace" onClick={() => alCancelar(c)}>
                  Cancelar
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Citas() {
  const { cuenta } = useSesion();
  const { info } = useInfo();
  const { avisar } = useAvisos();
  const [params, setParams] = useSearchParams();
  const [disp, setDisp] = useState<Disponibilidad | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [mias, setMias] = useState<Cita[]>([]);
  const [motivo, setMotivo] = useState<MotivoCita>('EXAMEN_VISTA');
  const [telefono, setTelefono] = useState(cuenta?.telefono ?? '');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<unknown>(null);
  const [reservada, setReservada] = useState<Cita | null>(null);

  const fecha = params.get('fecha');
  const hora = params.get('hora');

  const cargar = () => {
    setError(null);
    tienda.disponibilidad(undefined, 14).then(setDisp).catch(setError);
    if (cuenta) tienda.citas().then(setMias).catch(() => undefined);
  };
  useEffect(cargar, [cuenta]);
  useEffect(() => {
    if (cuenta?.telefono && !telefono) setTelefono(cuenta.telefono);
  }, [cuenta, telefono]);

  const diaElegido = useMemo(() => disp?.dias.find((d) => d.fecha === fecha) ?? disp?.dias.find((d) => d.turnos.some((t) => t.libre)) ?? null, [disp, fecha]);
  const horaValida = diaElegido?.turnos.some((t) => t.hora === hora && t.libre) ? hora : null;

  const elegir = (f: string, h: string | null) => {
    const p = new URLSearchParams();
    p.set('fecha', f);
    if (h) p.set('hora', h);
    setParams(p, { replace: true });
    setErrorEnvio(null);
  };

  const reservar = async (e: FormEvent) => {
    e.preventDefault();
    if (!diaElegido || !horaValida) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const c = await tienda.reservarCita({ fecha: diaElegido.fecha, hora: horaValida, motivo, telefono: telefono.trim(), notas: notas.trim() || undefined });
      setReservada(c);
      setNotas('');
      setParams({}, { replace: true });
      cargar();
      window.scrollTo(0, 0);
    } catch (err) {
      setErrorEnvio(err);
      cargar();
    } finally {
      setEnviando(false);
    }
  };

  const cancelar = async (c: Cita) => {
    if (!window.confirm(`¿Cancelar tu cita del ${fechaCita(c.fecha)} a las ${c.hora}?`)) return;
    try {
      await tienda.cancelarCita(c.id);
      avisar('Cita cancelada');
      if (reservada?.id === c.id) setReservada(null);
      cargar();
    } catch (err) {
      avisar((err as Error).message, { tipo: 'error' });
    }
  };

  const manana = diaElegido?.turnos.filter((t) => t.hora < '13:00') ?? [];
  const tarde = diaElegido?.turnos.filter((t) => t.hora >= '13:00') ?? [];
  const volver = `/citas${horaValida && diaElegido ? `?fecha=${diaElegido.fecha}&hora=${horaValida}` : ''}`;
  const campos = erroresDe(errorEnvio);

  return (
    <div className="contenedor angosto-ancho">
      <h1>Reserva tu examen de la vista</h1>
      <p className="texto-suave intro-citas">
        Elige el día y la hora. Te atendemos en {info?.sucursal.nombre ?? 'la óptica'}
        {info?.sucursal.direccion ? `, ${info.sucursal.direccion}` : ''}
        {disp ? `; cada turno dura ${disp.duracion} minutos` : ''}.
      </p>

      {reservada && (
        <div className="estado estado-ok" role="status">
          <h2>Tu cita está reservada</h2>
          <p>
            {fechaCita(reservada.fecha)} a las {reservada.hora}, {reservada.motivoTexto.toLowerCase()}. Te escribiremos al {reservada.telefono} para confirmarla.
            Si usas lentes, tráelos.
          </p>
        </div>
      )}

      {error ? (
        <MensajeError error={error} reintentar={cargar} />
      ) : !disp ? (
        <Cargando texto="Buscando turnos libres…" />
      ) : disp.dias.length === 0 ? (
        <p>No hay turnos disponibles en los próximos días. Llámanos{info?.sucursal.telefono ? ` al ${info.sucursal.telefono}` : ''} y te buscamos un espacio.</p>
      ) : (
        <form onSubmit={reservar} className="reserva">
          <fieldset className="grupo">
            <legend>Día</legend>
            <div className="dias" role="radiogroup" aria-label="Día">
              {disp.dias.map((d) => {
                const libres = d.turnos.filter((t) => t.libre).length;
                const f = fechaUtc(d.fecha);
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={diaElegido?.fecha === d.fecha}
                    key={d.fecha}
                    className="dia"
                    disabled={libres === 0}
                    onClick={() => elegir(d.fecha, null)}
                  >
                    <span className="dia-semana">{diaCorto.format(f).replace('.', '')}</span>
                    <span className="dia-numero">{f.getUTCDate()}</span>
                    <span className="dia-mes">{libres === 0 ? 'lleno' : mesCorto.format(f).replace('.', '')}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {diaElegido && (
            <fieldset className="grupo">
              <legend>Hora, {fechaCita(diaElegido.fecha)}</legend>
              {[
                ['Mañana', manana],
                ['Tarde', tarde],
              ].map(([titulo, lista]) =>
                (lista as typeof manana).length ? (
                  <div key={titulo as string}>
                    <p className="turnos-titulo">{titulo as string}</p>
                    <div className="turnos" role="radiogroup" aria-label={titulo as string}>
                      {(lista as typeof manana).map((t) => (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={horaValida === t.hora}
                          key={t.hora}
                          className="turno"
                          disabled={!t.libre}
                          onClick={() => elegir(diaElegido.fecha, t.hora)}
                        >
                          {t.hora}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </fieldset>
          )}

          {horaValida && diaElegido && (
            <fieldset className="grupo">
              <legend>Tus datos</legend>
              {!cuenta ? (
                <div className="estado">
                  <p>Para reservar necesitas una cuenta: así puedes ver y cancelar tu cita cuando quieras.</p>
                  <div className="estado-acciones">
                    <Link className="boton boton-primario" to={`/ingresar?volver=${encodeURIComponent(volver)}`}>
                      Ingresar para reservar
                    </Link>
                    <Link className="boton boton-secundario" to={`/registrarse?volver=${encodeURIComponent(volver)}`}>
                      Crear cuenta
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <Campo etiqueta="Motivo" nombre="motivo">
                    <select id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoCita)}>
                      {Object.entries(disp.motivos).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </Campo>
                  <Campo
                    etiqueta="Teléfono o WhatsApp"
                    nombre="telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    error={campos.telefono}
                    ayuda="Te escribimos para confirmar la cita."
                  />
                  <Campo etiqueta="¿Algo que debamos saber? (opcional)" nombre="notas">
                    <textarea id="notas" rows={2} maxLength={500} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Por ejemplo: veo borroso de lejos, uso lentes hace 2 años" />
                  </Campo>
                  {errorEnvio != null && Object.keys(campos).length === 0 && <MensajeError error={errorEnvio} />}
                  <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando || telefono.trim().length < 6}>
                    {enviando ? 'Reservando…' : `Reservar el ${fechaCita(diaElegido.fecha)} a las ${horaValida}`}
                  </button>
                </>
              )}
            </fieldset>
          )}
        </form>
      )}

      {cuenta && <MisCitas citas={mias} alCancelar={cancelar} />}
    </div>
  );
}
