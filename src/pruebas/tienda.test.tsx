import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorAvisos } from '../estado/Avisos';
import { ProveedorCarrito, useCarrito } from '../estado/Carrito';
import { ProveedorInfo } from '../estado/Info';
import { ProveedorSesion } from '../estado/Sesion';
import { Producto } from '../paginas/Producto';
import { bs, medidas } from '../util/formato';

const PRODUCTO = {
  id: '11111111-1111-4111-8111-111111111111',
  nombre: 'Montura Vitaly 2201 carey',
  descripcion: null,
  tipo: 'MONTURA',
  marcaId: null,
  marca: 'Vitaly',
  modelo: null,
  atributos: { calibre: 52, puente: 18, varilla: 140, material: 'Acetato' },
  precio: 45000,
  imagenUrl: null,
  disponible: 2,
  creadoEn: '2026-10-15T00:00:00Z',
  relacionados: [],
};
const INFO = { sucursal: { nombre: 'Casa matriz', direccion: null, telefono: null }, costoEnvio: 2000, pagoEnLinea: false, minutosReserva: 30, diasRetiro: 3, categorias: [], marcas: [] };

function Contador() {
  const { carrito } = useCarrito();
  return <p data-testid="unidades">{carrito.unidades}</p>;
}

describe('formato', () => {
  it('muestra bolivianos desde centavos', () => {
    expect(bs(120050).replace(/\s/g, ' ')).toBe('Bs 1.200,50');
  });
  it('arma las medidas de montura como en las ópticas', () => {
    expect(medidas({ calibre: 52, puente: 18, varilla: 140 })).toBe('52□18 140');
    expect(medidas({ calibre: 52 })).toBeNull();
  });
});

describe('carrito de visitante', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const cuerpo = url.endsWith('/tienda/info') ? INFO : PRODUCTO;
        return new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'content-type': 'application/json' } });
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('agrega sin cuenta, lo guarda en el navegador y no pasa del stock', async () => {
    render(
      <MemoryRouter initialEntries={[`/productos/${PRODUCTO.id}`]}>
        <ProveedorAvisos>
          <ProveedorInfo>
            <ProveedorSesion>
              <ProveedorCarrito>
                <Contador />
                <Routes>
                  <Route path="/productos/:id" element={<Producto />} />
                </Routes>
              </ProveedorCarrito>
            </ProveedorSesion>
          </ProveedorInfo>
        </ProveedorAvisos>
      </MemoryRouter>,
    );
    const u = userEvent.setup();
    expect(await screen.findByRole('heading', { name: PRODUCTO.nombre })).toBeTruthy();
    expect(screen.getByText('52□18 140')).toBeTruthy();

    await u.click(screen.getByRole('button', { name: 'Agregar uno' }));
    // Solo hay 2: el + se desactiva
    expect((screen.getByRole('button', { name: 'Agregar uno' }) as HTMLButtonElement).disabled).toBe(true);
    await u.click(screen.getByRole('button', { name: 'Agregar al carrito' }));
    await waitFor(() => expect(screen.getByTestId('unidades').textContent).toBe('2'));
    expect(JSON.parse(localStorage.getItem('provision.carrito')!)[0]).toMatchObject({ productoId: PRODUCTO.id, cantidad: 2 });

    // Ya no quedan unidades para agregar
    expect((screen.getByRole('button', { name: 'Agregar al carrito' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
