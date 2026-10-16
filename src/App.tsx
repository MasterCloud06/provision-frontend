import { Route, Routes } from 'react-router';
import { Marco } from './componentes/Marco';
import { Ingresar, Registrarse } from './paginas/Acceso';
import { Carrito } from './paginas/Carrito';
import { Citas } from './paginas/Citas';
import { Catalogo } from './paginas/Catalogo';
import { Cuenta } from './paginas/Cuenta';
import { Finalizar } from './paginas/Finalizar';
import { Inicio } from './paginas/Inicio';
import { MisPedidos } from './paginas/MisPedidos';
import { Ayuda, NoEncontrado, RequiereSesion } from './paginas/Otras';
import { Pedido } from './paginas/Pedido';
import { Producto } from './paginas/Producto';

export function App() {
  return (
    <Routes>
      <Route element={<Marco />}>
        <Route index element={<Inicio />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="productos/:id" element={<Producto />} />
        <Route path="carrito" element={<Carrito />} />
        <Route path="ingresar" element={<Ingresar />} />
        <Route path="registrarse" element={<Registrarse />} />
        <Route path="ayuda" element={<Ayuda />} />
        <Route path="citas" element={<Citas />} />
        <Route element={<RequiereSesion />}>
          <Route path="finalizar" element={<Finalizar />} />
          <Route path="pedidos" element={<MisPedidos />} />
          <Route path="pedidos/:id" element={<Pedido />} />
          <Route path="cuenta" element={<Cuenta />} />
        </Route>
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
