import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { ProveedorAvisos } from './estado/Avisos';
import { ProveedorCarrito } from './estado/Carrito';
import { ProveedorInfo } from './estado/Info';
import { ProveedorSesion } from './estado/Sesion';
import './estilos.css';

// GitHub Pages no conoce las rutas de la tienda: 404.html guarda la ruta pedida y la recuperamos aquí.
const pendiente = sessionStorage.getItem('provision.ruta');
if (pendiente) {
  sessionStorage.removeItem('provision.ruta');
  history.replaceState(null, '', pendiente);
}

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ProveedorAvisos>
        <ProveedorInfo>
          <ProveedorSesion>
            <ProveedorCarrito>
              <App />
            </ProveedorCarrito>
          </ProveedorSesion>
        </ProveedorInfo>
      </ProveedorAvisos>
    </BrowserRouter>
  </StrictMode>,
);
