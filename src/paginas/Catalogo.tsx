import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { tienda, type FiltrosCatalogo } from '../api/tienda';
import type { Genero, Pagina, Producto, TipoProducto } from '../api/tipos';
import { Cargando, MensajeError, Vacio } from '../componentes/Basicos';
import { TarjetaProducto } from '../componentes/TarjetaProducto';
import { useInfo } from '../estado/Info';
import { GENEROS, ORDEN_TIPOS, plural, TIPOS } from '../util/formato';

const POR_PAGINA = 24;
const ORDENES = { nuevos: 'Más nuevos', precio_asc: 'Menor precio', precio_desc: 'Mayor precio', nombre: 'Nombre' } as const;

/** Bs escritos → centavos. */
const aCentavos = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Math.round(Number(v) * 100) : undefined);

export function Catalogo() {
  const { info } = useInfo();
  const [params, setParams] = useSearchParams();
  const [resultado, setResultado] = useState<Pagina<Producto> | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [cargando, setCargando] = useState(true);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [intento, setIntento] = useState(0);

  const filtros = useMemo<FiltrosCatalogo>(
    () => ({
      q: params.get('q') ?? undefined,
      tipo: (params.get('tipo') as TipoProducto) ?? undefined,
      marcaId: params.get('marca') ?? undefined,
      genero: (params.get('genero') as Genero) ?? undefined,
      precioMin: aCentavos(params.get('desde')),
      precioMax: aCentavos(params.get('hasta')),
      disponibles: params.get('disponibles') === '1' || undefined,
      orden: (params.get('orden') as FiltrosCatalogo['orden']) ?? 'nuevos',
      pagina: Number(params.get('pagina') ?? 1) || 1,
      porPagina: POR_PAGINA,
    }),
    [params],
  );

  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    setError(null);
    tienda
      .productos(filtros, control.signal)
      .then(setResultado)
      .catch((e) => (e as Error).name !== 'AbortError' && setError(e))
      .finally(() => !control.signal.aborted && setCargando(false));
    return () => control.abort();
  }, [filtros, intento]);

  /** Cambia un filtro y vuelve a la primera página. */
  const cambiar = (clave: string, valor: string | null) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    if (clave !== 'pagina') p.delete('pagina');
    setParams(p);
  };
  const limpiar = () => setParams(filtros.q ? { q: filtros.q } : {});

  const titulo = filtros.q ? `Resultados para “${filtros.q}”` : filtros.tipo ? TIPOS[filtros.tipo].varios : 'Catálogo';
  const paginas = resultado ? Math.max(1, Math.ceil(resultado.total / POR_PAGINA)) : 1;
  const hayFiltros = ['tipo', 'marca', 'genero', 'desde', 'hasta', 'disponibles'].some((k) => params.has(k));
  const tiposConProductos = new Set(info?.categorias.map((c) => c.tipo));
  const muestraGenero = !filtros.tipo || ['MONTURA', 'GAFAS_SOL'].includes(filtros.tipo);

  return (
    <div className="contenedor catalogo">
      <div className="catalogo-cabecera">
        <div>
          <h1>{titulo}</h1>
          {resultado && <p className="texto-suave">{plural(resultado.total, 'producto', 'productos')}</p>}
        </div>
        <div className="catalogo-controles">
          <button type="button" className="boton boton-secundario boton-filtros" aria-expanded={filtrosAbiertos} aria-controls="filtros" onClick={() => setFiltrosAbiertos((v) => !v)}>
            Filtrar{hayFiltros ? ' (activos)' : ''}
          </button>
          <label className="orden">
            <span>Ordenar</span>
            <select value={filtros.orden} onChange={(e) => cambiar('orden', e.target.value === 'nuevos' ? null : e.target.value)}>
              {Object.entries(ORDENES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="catalogo-cuerpo">
        <aside id="filtros" className={`filtros ${filtrosAbiertos ? 'abierto' : ''}`} aria-label="Filtros">
          <fieldset>
            <legend>Tipo</legend>
            <label className="opcion">
              <input type="radio" name="tipo" checked={!filtros.tipo} onChange={() => cambiar('tipo', null)} />
              Todos
            </label>
            {ORDEN_TIPOS.filter((t) => tiposConProductos.has(t) || filtros.tipo === t).map((t) => (
              <label key={t} className="opcion">
                <input type="radio" name="tipo" checked={filtros.tipo === t} onChange={() => cambiar('tipo', t)} />
                {TIPOS[t].varios}
              </label>
            ))}
          </fieldset>

          {muestraGenero && (
            <fieldset>
              <legend>Para</legend>
              <div className="chips">
                {(['MUJER', 'HOMBRE', 'NINO'] as Genero[]).map((g) => (
                  <button type="button" key={g} className="chip" aria-pressed={filtros.genero === g} onClick={() => cambiar('genero', filtros.genero === g ? null : g)}>
                    {GENEROS[g]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {info && info.marcas.length > 0 && (
            <fieldset>
              <legend>Marca</legend>
              <select aria-label="Marca" value={filtros.marcaId ?? ''} onChange={(e) => cambiar('marca', e.target.value || null)}>
                <option value="">Todas las marcas</option>
                {info.marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </fieldset>
          )}

          <fieldset>
            <legend>Precio (Bs)</legend>
            <form
              className="rango"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const p = new URLSearchParams(params);
                for (const k of ['desde', 'hasta']) {
                  const v = String(f.get(k) ?? '').trim();
                  if (v) p.set(k, v);
                  else p.delete(k);
                }
                p.delete('pagina');
                setParams(p);
              }}
            >
              <input name="desde" type="number" min="0" inputMode="decimal" placeholder="Desde" aria-label="Precio desde" defaultValue={params.get('desde') ?? ''} key={`d${params.get('desde')}`} />
              <input name="hasta" type="number" min="0" inputMode="decimal" placeholder="Hasta" aria-label="Precio hasta" defaultValue={params.get('hasta') ?? ''} key={`h${params.get('hasta')}`} />
              <button type="submit" className="boton boton-secundario">
                Aplicar
              </button>
            </form>
          </fieldset>

          <label className="opcion">
            <input type="checkbox" checked={Boolean(filtros.disponibles)} onChange={(e) => cambiar('disponibles', e.target.checked ? '1' : null)} />
            Solo con stock
          </label>

          {hayFiltros && (
            <button type="button" className="enlace" onClick={limpiar}>
              Quitar filtros
            </button>
          )}
        </aside>

        <section className="catalogo-resultados" aria-live="polite" aria-busy={cargando}>
          {error ? (
            <MensajeError error={error} reintentar={() => setIntento((n) => n + 1)} />
          ) : !resultado ? (
            <Cargando texto="Buscando productos…" />
          ) : resultado.datos.length === 0 ? (
            <Vacio titulo="No encontramos productos con esa búsqueda">
              <p>Prueba con otra palabra o quita algunos filtros.</p>
              {(hayFiltros || filtros.q) && (
                <button type="button" className="boton boton-secundario" onClick={() => setParams({})}>
                  Ver todo el catálogo
                </button>
              )}
            </Vacio>
          ) : (
            <>
              <div className={`grilla-productos ${cargando ? 'actualizando' : ''}`}>
                {resultado.datos.map((p) => (
                  <TarjetaProducto key={p.id} p={p} />
                ))}
              </div>
              {paginas > 1 && (
                <nav className="paginacion" aria-label="Páginas">
                  <button type="button" className="boton boton-secundario" disabled={filtros.pagina! <= 1} onClick={() => cambiar('pagina', String(filtros.pagina! - 1))}>
                    Anterior
                  </button>
                  <span>
                    Página {filtros.pagina} de {paginas}
                  </span>
                  <button type="button" className="boton boton-secundario" disabled={filtros.pagina! >= paginas} onClick={() => cambiar('pagina', String(filtros.pagina! + 1))}>
                    Siguiente
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
