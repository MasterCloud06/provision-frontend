# Provisión · Tienda web

La tienda en línea de Provisión para los **clientes** de la óptica: buscan productos, crean su cuenta, arman su carrito y pagan con tarjeta (**Stripe**) o al retirar. Usa la API de [`provision-backend`](https://github.com/MasterCloud06/provision-backend); el personal sigue trabajando con la [app de escritorio](https://github.com/MasterCloud06/provision-desktop) y la [app Android](https://github.com/MasterCloud06/provision-app).

**Stack:** React 19 · Vite · TypeScript · React Router. Sin librerías de UI: estilos propios en `src/estilos.css`.

## Qué puede hacer un cliente

- **Ver el catálogo** sin cuenta: búsqueda, filtros por tipo, marca, para quién (mujer, hombre, niños), precio y stock; orden por novedad o precio.
- **Ficha del producto**: precio, disponibilidad, medidas de la montura en notación óptica (`52□18 140`), ficha técnica y relacionados.
- **Carrito**: se arma sin cuenta (queda en el navegador) y al ingresar se junta con el de su cuenta, que se guarda en el servidor.
- **Cuenta**: registro, ingreso, datos (teléfono, dirección, CI, NIT), cambio de contraseña y **recuperarla por correo** con un enlace de un solo uso. Cambiar o recuperar la contraseña cierra la sesión en los demás dispositivos.
- **Comprar**: retiro en la óptica (gratis) o envío a domicilio; pago con **tarjeta en Stripe** o **al retirar**. Los productos quedan reservados mientras paga.
- **Reservar examen de la vista**: días y turnos libres (según el horario de la óptica), motivo y teléfono; ver y cancelar sus citas. Se puede mirar la agenda sin cuenta; para reservar hay que ingresar.
- **Mis pedidos**: estado de cada pedido paso a paso, volver a intentar el pago o cancelarlo si aún no se pagó.

Si Stripe todavía no está configurado en el backend, la tienda lo detecta y solo ofrece *pagar al retirar*.

## Desarrollo

```powershell
npm install
npm run dev               # http://localhost:5173 contra tu backend local (localhost:3000)
npm run dev:desarrollo    # la tienda en tu PC, contra el servidor de desarrollo en Render
npm test                  # pruebas
npm run build             # compila en dist/
```

La dirección de la API se define en `.env.development`, `.env.desarrollo` y `.env.production` (`VITE_API_URL`).

En el backend, `CORS_ORIGIN` debe incluir la dirección de la tienda (`http://localhost:5173` en local) y `TIENDA_URL` debe apuntar a ella: es adonde Stripe devuelve al cliente después de pagar.

## Publicación en Render

La tienda se publica como **sitio estático en Render** con `render.yaml`. Cada cambio en `main` se publica solo, y GitHub Actions revisa el código y corre las pruebas en cada cambio.

**Crear el sitio (una sola vez):** en Render, *New → Blueprint* → elige este repo → *Apply*. Queda en `https://provision-tienda.onrender.com` (si ese nombre está tomado, Render agrega unas letras al final).

Si prefieres crearlo a mano (*New → Static Site*):

| Campo | Valor |
|---|---|
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Redirects/Rewrites | Source `/*` → Destination `/index.html` → Action **Rewrite** |

**Luego, en el backend** (Render → servicio del backend → *Environment*), con la dirección que te dio Render:

| Variable | Valor |
|---|---|
| `CORS_ORIGIN` | agrega `https://provision-tienda.onrender.com` (separado por coma) |
| `TIENDA_URL` | `https://provision-tienda.onrender.com` |

`CORS_ORIGIN` autoriza a la tienda a pedirle datos al backend; `TIENDA_URL` es adonde Stripe devuelve al cliente después de pagar.

## Pago con Stripe

El pago se hace en **Stripe Checkout**, la página de pago de Stripe: la tienda nunca ve ni guarda datos de tarjetas. El flujo:

1. El cliente confirma → el backend crea el pedido, reserva el stock y abre una sesión de pago en Stripe.
2. La tienda lo lleva a Stripe; al pagar, Stripe lo devuelve a `/pedidos/:id?pago=exito`.
3. El backend confirma el pago por el webhook de Stripe y, como respaldo, cuando la tienda vuelve y pide verificarlo.

Las llaves de Stripe van **solo en el backend** (ver su README). Para probar: tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.

## Estructura

```
src/
  api/          # cliente HTTP, endpoints de la tienda y tipos
  estado/       # sesión, carrito (visitante y cuenta), avisos, datos de la tienda
  componentes/  # encabezado y pie, tarjeta e imagen de producto, campos, cantidades
  paginas/      # inicio, catálogo, producto, carrito, finalizar, pedido, mis pedidos, cuenta, acceso
  util/         # dinero (centavos → Bs), fechas, nombres de tipos y estados
  estilos.css   # todo el diseño
```

## Diseño

La portada es una **cartilla de agudeza visual**: filas de letras cada vez más pequeñas con su valor decimal al costado, que entran en foco al cargar, y la franja roja y verde de la prueba bicromática al pie. La tipografía es **Atkinson Hyperlegible Next**, creada por el Braille Institute para personas con baja visión. Los productos sin foto muestran un dibujo de línea según su tipo; para usar fotos, carga una URL en el campo `imagenUrl` del producto.
