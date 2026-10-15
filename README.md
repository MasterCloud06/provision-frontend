# Provisión · Tienda web

La tienda en línea de Provisión para los **clientes** de la óptica: buscan productos, crean su cuenta, arman su carrito y pagan con tarjeta (**Stripe**) o al retirar. Usa la API de [`provision-backend`](https://github.com/MasterCloud06/provision-backend); el personal sigue trabajando con la [app de escritorio](https://github.com/MasterCloud06/provision-desktop) y la [app Android](https://github.com/MasterCloud06/provision-app).

**Stack:** React 19 · Vite · TypeScript · React Router. Sin librerías de UI: estilos propios en `src/estilos.css`.

## Qué puede hacer un cliente

- **Ver el catálogo** sin cuenta: búsqueda, filtros por tipo, marca, para quién (mujer, hombre, niños), precio y stock; orden por novedad o precio.
- **Ficha del producto**: precio, disponibilidad, medidas de la montura en notación óptica (`52□18 140`), ficha técnica y relacionados.
- **Carrito**: se arma sin cuenta (queda en el navegador) y al ingresar se junta con el de su cuenta, que se guarda en el servidor.
- **Cuenta**: registro, ingreso, datos (teléfono, dirección, CI, NIT) y cambio de contraseña.
- **Comprar**: retiro en la óptica (gratis) o envío a domicilio; pago con **tarjeta en Stripe** o **al retirar**. Los productos quedan reservados mientras paga.
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

## Publicación

Cada cambio en `main` se revisa, se prueba y se publica solo con GitHub Actions (`.github/workflows/publicar.yml`) en la rama `gh-pages`:

**https://mastercloud06.github.io/provision-frontend/**

La primera vez, en el repo: *Settings → Pages → Source: Deploy from a branch → `gh-pages` / root*. (GitHub Pages en repos privados requiere un plan de pago; si el repo es privado y gratuito, usa Render.)

Luego, en el backend (Render → *Environment*):

| Variable | Valor |
|---|---|
| `CORS_ORIGIN` | agrega `https://mastercloud06.github.io` (separado por coma) |
| `TIENDA_URL` | `https://mastercloud06.github.io/provision-frontend` |

**Alternativa: Render.** `render.yaml` publica la tienda como sitio estático (*New → Blueprint*). En ese caso usa su dirección `https://….onrender.com` en `CORS_ORIGIN` y `TIENDA_URL`.

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
public/404.html # para que las rutas funcionen en GitHub Pages
```

## Diseño

La portada es una **cartilla de agudeza visual**: filas de letras cada vez más pequeñas con su valor decimal al costado, que entran en foco al cargar, y la franja roja y verde de la prueba bicromática al pie. La tipografía es **Atkinson Hyperlegible Next**, creada por el Braille Institute para personas con baja visión. Los productos sin foto muestran un dibujo de línea según su tipo; para usar fotos, carga una URL en el campo `imagenUrl` del producto.
