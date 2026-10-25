# Arquitectura del Frontend

Este documento explica **cómo se construye la SPA y por qué**: las decisiones de arquitectura, los frameworks y librerías elegidos, las alternativas descartadas y los límites conocidos. Las reglas obligatorias de implementación están en [`requerimientos.md`](requerimientos.md).

> **Estado:** Fases 1 a 6 implementadas y verificadas en el navegador (ver §13). Falta la Fase 7 (despliegue en Vercel y Render).

## 1. Visión General

SPA en React que consume la API REST de `backend/`. Los datos fluyen siempre en la misma dirección, en capas con una única responsabilidad cada una:

```
Página (contenedor)            pages/BoardDetailPage.jsx
   │  usa hooks del dominio
   ▼
Hooks de TanStack Query        features/tickets/hooks/useMoveTicket.js
   │  llaman a servicios           (caché, loading/error, optimistic UI)
   ▼
Servicios de la API            api/ticketService.js
   │  usan la instancia de Axios
   ▼
httpClient (Axios)             api/httpClient.js  →  ApiError { status, message }
   │
   ▼
Backend REST  (o MSW en desarrollo, si VITE_USE_MOCKS=true)

Los datos bajan por props:  Página → componentes presentacionales (TicketCard, ColumnView...)
Los eventos suben por callbacks:  onDelete, onSubmit, onMove...
```

## 2. Stack Tecnológico y Motivos

| Tecnología | Por qué | Alternativas descartadas |
|---|---|---|
| **Vite** | Arranque y recarga casi instantáneos, configuración mínima y variables de entorno integradas (`import.meta.env`). | **Create React App:** está discontinuado. |
| **React 19** | Cumple el requisito "React 18+" y es la versión estable actual. Solo componentes funcionales y hooks. | — |
| **JavaScript** | Coincide con el backend y con los ejemplos de la consigna (`.jsx`). Reduce la fricción del curso. | **TypeScript:** más seguridad de tipos, pero suma configuración y curva de aprendizaje. |
| **React Router 7** (`react-router-dom`) | Cumple "v6+" y mantiene la API de v6 (`useNavigate`, `useParams`, `Navigate`). Se instaló el paquete `react-router-dom`, que es el nombre que usa la consigna; en la v7 equivale a `react-router`. | — |
| **oxlint** | Es el linter que trae la plantilla actual de Vite. Es mucho más rápido que ESLint y ya incluye las reglas de hooks y de Fast Refresh. | **ESLint:** la plantilla ya no lo incluye y no hacía falta agregarlo. |
| **TanStack Query v5** | Resuelve caché, estados de loading y error, reintentos, invalidación y **actualización optimista con rollback** (`onMutate` / `onError`), que es justo lo que pide el Kanban. | **Axios + Context API:** obliga a escribir a mano la caché, la invalidación y el rollback. |
| **Axios** | Instancia con `baseURL` única, interceptores para transformar los errores del backend en un `ApiError` uniforme y JSON automático. Es el cliente que pide la consigna. | **`fetch` nativo:** no rechaza las respuestas 4xx/5xx y no tiene interceptores. |
| **Context API** | Suficiente para el poco estado global de UI: tema y sesión simulada. | **Redux / Zustand:** de más, porque el estado del servidor ya lo maneja TanStack Query. |
| **React Hook Form + Zod** | Formularios sin re-renders innecesarios, esquemas declarativos reutilizables y `setError` para mostrar en el input los errores del backend. | **Yup:** equivalente, pero Zod tiene mejor ergonomía y mensajes. **Formik:** más pesado. |
| **@dnd-kit/core** | Drag & drop moderno, liviano, mantenido y **accesible con teclado** (`KeyboardSensor`). | **react-beautiful-dnd:** discontinuado por Atlassian. **API nativa de HTML5:** no anda en táctil y no es accesible. |
| **sonner** | Toasts con una API mínima (`toast.error(...)`) y estilos que se adaptan al tema mediante variables. | **react-hot-toast:** equivalente. Se eligió uno solo para no duplicar. |
| **MSW 2** | Intercepta las peticiones a nivel de red, así que los servicios no se enteran de si hablan con el backend real o con el mock. | **json-server:** es otro servidor y no reproduce las reglas de error del backend. |
| **CSS Modules + Custom Properties** | Estilos con alcance local por componente, sin dependencias extra, y los colores del tema centralizados en variables CSS. | **Tailwind:** se descartó a favor de CSS propio. **Bootstrap:** su tema no encaja con la paleta pedida. |

## 3. Estructura de Carpetas

| Carpeta | Responsabilidad | Por qué existe |
|---|---|---|
| `api/` | Único punto de contacto con HTTP. | Si cambia la API o la librería HTTP, se toca solo esta capa. |
| `features/<dominio>/` | Componentes, hooks y esquemas de `boards`, `columns` y `tickets`. | Agrupar por dominio mantiene juntos los archivos que cambian juntos. |
| `components/` | UI genérica (Button, Input, Modal, Spinner, ThemeToggle). | Reutilizable en cualquier dominio y sin conocer la API. |
| `pages/` | Contenedores asociados a una ruta. | Es donde se conectan los datos con la UI. |
| `routes/` | Definición del router y `ProtectedRoute`. | El mapa de navegación queda en un solo lugar. |
| `context/` + `hooks/` | Tema y sesión (`useTheme`, `useAuth`). | Es el estado global de UI. No guarda datos del servidor. |
| `mocks/` | Datos sintéticos y handlers de MSW. | Permite desarrollar sin el backend levantado. |
| `styles/` | `tokens.css` y `global.css`. | Es la única fuente de colores y tipografías. |

## 4. Patrón Presentacional / Contenedor

- **Presentacionales** (por ejemplo, `TicketCard`): reciben todo por props y avisan con callbacks. No conocen la API, TanStack Query ni el router. Se pueden probar y reutilizar solos, y se desarrollan con los datos de `mockData.js`.
- **Contenedores** (`pages/`): obtienen los datos con los hooks del dominio, manejan la navegación y los Toasts, y orquestan a los presentacionales.

Separarlos evita el problema típico del código generado por IA: componentes gigantes que mezclan `fetch`, estado y JSX.

## 5. Estado: Servidor vs. UI

| Tipo de estado | Dónde vive | Ejemplos |
|---|---|---|
| Estado del servidor | Caché de TanStack Query | Tableros, columnas, tickets |
| Estado global de UI | Context API (+ `localStorage`) | Tema, sesión simulada |
| Estado local de UI | `useState` del componente | Modal abierto, ticket que se está arrastrando |
| Estado de formularios | React Hook Form | Valores, errores, `isSubmitting` |

La regla es no duplicar: los datos del servidor no se copian ni a Context ni a `useState`.

## 6. Sincronización con el Servidor

- **Petición estándar** (crear, editar, borrar): se espera la respuesta del backend y se invalida la query. Son operaciones poco frecuentes y vale más la consistencia que la inmediatez.
- **Actualización optimista** (mover un ticket): arrastrar tiene que sentirse instantáneo. El ticket se mueve en la caché antes de la respuesta; si el backend falla, se restaura la copia anterior y se muestra un Toast.
- Esto es seguro porque el `PATCH` del backend es **idempotente**: reintentar un movimiento no corrompe el estado.

## 7. Manejo de Errores

```
Backend { "error": "..." }  ──►  interceptor de Axios  ──►  ApiError { status, message }
                                                              │
                     ┌────────────────────────────────────────┼─────────────────────┐
                     ▼                                        ▼                     ▼
          400 en un formulario                      400/404 al mover        404/500/red
   setError('campo', { message })              rollback + Toast         Toast / estado de error
   (alerta debajo del input)                                             de la página
```

Como el backend siempre responde con el formato `{ "error": "..." }`, el frontend puede mostrar el mensaje tal cual, sin tener que traducir errores caso por caso.

### Implementación de la capa API (Fase 2)

| Decisión | Por qué |
|---|---|
| **`ApiError` propio** (`status`, `message`) | Los componentes nunca ven errores de Axios: cualquier fallo llega con la misma forma, ya sea del backend, de MSW o de la red (`status: 0`). |
| **`session.js` separado de `httpClient.js`** | El interceptor necesita leer la sesión para enviar `X-User-Id`, y `AuthProvider` (Fase 4) necesita escribirla. Un módulo pequeño evita que la capa HTTP dependa de React. |
| **`setUnauthorizedHandler(fn)` en lugar de redirigir desde Axios** | Ante un 401 fuera del login, `httpClient` borra la sesión y avisa mediante un callback, pero no conoce el router. `AuthProvider` registrará ese callback y decidirá cómo volver a `/login`. |
| **Servicios como objetos** (`boardService.getBoardById`) | Coincide con la forma de uso de la consigna y agrupa las funciones por recurso. |
| **`encodeURIComponent` en los IDs** | Un ID inválido que llega desde la URL de la SPA (por ejemplo, `/boards/abc/def`) no rompe la ruta de la API: el backend lo recibe entero y responde 400. |
| **Timeout de 90 s** | Cubre los ~50 s de arranque en frío de Render con margen. |

### Mocks fieles al backend

- El mock se dividió en cuatro archivos con una responsabilidad cada uno: `mockData.js` (datos iniciales), `db.js` (estado en memoria y serialización como Mongoose, incluido el virtual `id` de tableros y columnas), `rules.js` (validaciones del backend) y `handlers.js` (endpoints HTTP).
- `rules.js` copia **los mismos mensajes y el mismo orden de validación** del backend: primero el JSON, después el usuario, el formato del ID, la existencia, la pertenencia y por último el payload. Así, una pantalla probada con mocks se comporta igual contra la API real.
- **Verificación:** se ejecutó el mismo escenario de 28 pasos (los 9 métodos de los servicios, con casos de éxito y de error) contra el backend real y contra MSW. Coincidieron el código HTTP, el mensaje y la forma del JSON en todos los pasos.
- **Costo:** si el backend cambia un mensaje o una regla, hay que actualizar `rules.js` a mano.

## 8. Tema Visual: "Minimalismo Developer"

- **Por qué este estilo:** la app es una herramienta para desarrolladores. Una estética de IDE o terminal (alto contraste, bordes finos, tipografía monoespaciada para IDs) reduce la fatiga visual y prioriza la información.
- **Tokens en variables CSS:** los colores de la consigna (y algunos derivados, como bordes, texto secundario y el color de peligro) se definen una sola vez en `tokens.css`, en `:root` (light) y `:root.dark` (dark). Cambiar de tema es cambiar una clase, no tocar componentes.
- **Detección y persistencia:** si el usuario no eligió un tema, se respeta `prefers-color-scheme`. Su elección manual se guarda en `localStorage`.
- **Sin parpadeo:** un script inline en el `<head>` de `index.html` aplica la clase `.dark` antes del primer pintado. Si se hiciera desde React, la página se vería un instante con el tema equivocado.
- **Implementación (Fase 1):**
  - `ThemeContext.js` solo crea el contexto y `ThemeProvider.jsx` solo exporta el componente. Separarlos mantiene el Fast Refresh de Vite, que exige que un archivo `.jsx` exporte solo componentes.
  - `ThemeProvider` distingue la **elección manual** (guardada en `localStorage`) del **tema del sistema** (escuchado con `matchMedia`): el tema efectivo es la elección manual si existe y, si no, el del sistema.
  - `ThemeToggle` es presentacional: recibe `theme` y `onToggle` por props, y los íconos son SVG con `currentColor`, sin colores propios.
- **Tokens derivados agregados en la Fase 1:**
  - `--text-on-accent`: el texto sobre fondo de acento necesita otro color en cada tema para mantener el contraste (blanco sobre el índigo claro, azul medianoche sobre el índigo suave).
  - `--shadow-card`: una sombra mínima en el modo claro y ninguna en el oscuro, donde las tarjetas se separan solo por el borde.
  - Escalas de espaciado (`--space-*`), radios (`--radius-*`) y duración de transición, para que los componentes no usen valores sueltos.

## 9. Usuario Único y Sesión Simulada

- La consigna pide `/login`, rutas protegidas y "tableros del usuario", pero la autenticación completa no es obligatoria en esta etapa.
- **Decisión:** el backend tiene **un único usuario** en la colección `users`, creado por un seed, y el login se valida contra él. El frontend guarda la respuesta `{ _id, name, email }` en `localStorage` (`AuthContext`) y un interceptor de Axios envía el `_id` en el header `X-User-Id`. Con eso, el backend asigna el dueño de los tableros nuevos y lista solo los del usuario.
- `ProtectedRoute` redirige a `/login` si no hay sesión, y un `401` de la API borra la sesión.
- **Limitación:** no hay token, así que **la API no queda protegida**: cualquiera que conozca el `_id` puede llamarla. La evolución natural es que el login devuelva un JWT y que el interceptor envíe `Authorization: Bearer <token>` en lugar de `X-User-Id`. Gracias a la capa `src/api`, ese cambio quedaría concentrado en `httpClient.js`.

## 10. Variables de Entorno, Mocks y Despliegue

- `VITE_API_URL` es el **único** lugar donde se define la URL del backend. Así se puede apuntar a otro servidor (local, staging o producción) sin tocar código.
- `VITE_USE_MOCKS=true` activa MSW en desarrollo. Los handlers reproducen los mismos códigos y el mismo formato de error que el backend, así que la UI se comporta igual con o sin servidor.
- **Despliegue en Vercel:** la SPA se compila a archivos estáticos (`dist/`) y se sirve desde la CDN de Vercel. `vercel.json` reescribe todas las rutas a `index.html`, porque si no, recargar `/boards/:boardId` daría 404 (esa ruta solo existe en el router del cliente).
- **¿Por qué Vercel y no Render para el frontend?** Vercel está pensado para sitios estáticos y SPAs: CDN global, deploy automático desde GitHub y previews por rama, sin servidor que se suspenda. El backend sí va a Render, porque necesita un proceso Node siempre disponible.
- **Variable en el build:** Vite reemplaza `import.meta.env.VITE_API_URL` al compilar, así que cambiar la URL del backend requiere volver a desplegar el frontend.

## 11. Limitaciones Conocidas

| Limitación | Motivo |
|---|---|
| No se pueden reordenar tickets dentro de una columna | El backend no guarda un orden. |
| La sesión es simulada (sin token) | Un único usuario y header `X-User-Id`; la autenticación completa no es obligatoria. |
| La primera petición puede tardar ~50 s en producción | El plan gratuito de Render suspende el backend sin uso; los estados de loading cubren la espera. |
| No hay sincronización en tiempo real entre pestañas o usuarios | Fuera del alcance (se podría con WebSockets o polling). |
| No se pueden editar columnas | El contrato del backend no tiene `PATCH` de columnas. |

## 12. Versiones Instaladas

Versiones fijadas al crear el proyecto (Fase 1), con la plantilla `react` de `create-vite` 9.3:

| Paquete | Versión | Nota |
|---|---|---|
| `vite` | 8.3 | — |
| `react` / `react-dom` | 19.3 | — |
| `react-router-dom` | 7.18 | — |
| `@tanstack/react-query` | 5.104 | — |
| `axios` | 1.20 | — |
| `react-hook-form` | 7.90 | — |
| `zod` | 4.6 | — |
| `@hookform/resolvers` | **5.9** | La 6.0.0 declara dependencias opcionales que se contradicen entre sí (`effect` 3 y 4), y npm no puede resolverlas sin `--legacy-peer-deps`. La 5.9 es la última estable anterior y admite Zod 4, así que se fijó esa versión para no forzar la instalación. |
| `@dnd-kit/core` | 6.3 | — |
| `sonner` | 2.0 | — |
| `msw` | 2.15 (dev) | — |
| `oxlint` | 1.89 (dev) | — |

## 13. Implementación de las Fases 3 a 6

### Componentes (Fase 3)
| Decisión | Por qué |
|---|---|
| **`Button` con `type="button"` por defecto e `isLoading`** | Un botón dentro de un `<form>` es `submit` por defecto, y un "Cancelar" enviaba el formulario. Con `isLoading` el botón se deshabilita y muestra un spinner, como pide §8, sin repetir esa lógica en cada pantalla. |
| **`Input` único con `as`** (`input`, `textarea` o `select`) | Un mismo componente asocia el label (`useId`), marca `aria-invalid` y muestra el error con `role="alert"` para cualquier tipo de campo. |
| **`Modal` y `ConfirmDialog` propios** | Reemplazan a `window.confirm`: se ven con el tema, avisan del borrado en cascada y muestran el spinner mientras se borra. Se cierran con Escape o con un clic fuera del panel. |
| **`useServerError(serverError, setError, campo)`** | Lleva el `ApiError` de la mutación al campo correspondiente del formulario (el 400 al input, el 401 del login al error general). Recibe el objeto y no el mensaje, para que un segundo fallo idéntico también se muestre. |
| **Callbacks opcionales** | Un componente solo muestra un botón si la página le pasa la acción. Así el mismo `TicketCard` sirve en el tablero y en el `DragOverlay`. |
| **Esquemas Zod por dominio** (`features/<dominio>/schemas.js`) | Cada esquema vive junto a su formulario. El login se separó en `features/auth`. |

### Rutas y sesión (Fase 4)
- `ProtectedRoute` y `AppLayout` son **rutas de layout** (`<Outlet />`): el header con el usuario, el tema y el cierre de sesión se escribe una sola vez para todas las páginas protegidas.
- `AuthProvider` registra el callback de `setUnauthorizedHandler`: ante un 401 de una sesión vieja limpia la caché, borra el usuario y avisa con un Toast. `ProtectedRoute` lleva a `/login` y guarda la ruta original.
- El login también pasa por TanStack Query (`useLogin`), como toda mutación.
- `QueryClient` solo reintenta las fallas de red y los 5xx: reintentar un 400 o un 404 no cambia el resultado.

### Mutaciones (Fase 5)
- Los hooks de mutación solo invalidan la query afectada. Los Toasts y la navegación los decide la página, porque dependen del contexto (por ejemplo, después de crear un tablero se navega a él).
- `toastApiError(error, [400])` centraliza la regla: los códigos que el formulario ya muestra no se repiten en un Toast, y el 401 lo maneja `AuthProvider`.
- `BoardDetailDialogs` agrupa los seis flujos de diálogo del detalle (crear y eliminar columna, crear, editar y eliminar ticket, eliminar tablero), para que `BoardDetailPage` no pase las ~150 líneas.

### Drag & drop (Fase 6)
- **`useMoveTicket`:** `onMutate` mueve el ticket en la caché, `onError` restaura la copia y avisa, y `onSettled` resincroniza. La URL del `PATCH` usa la columna de origen, y el backend es idempotente si se reintenta.
- **Mouse:** se arrastra desde cualquier parte de la tarjeta. `PointerSensor` se activa recién a los 5 px, así los botones "Editar" y "Eliminar" siguen funcionando con un clic.
- **Teclado:** la manija (⠿) es el activador accesible. Con Espacio o Enter se toma el ticket, y `columnKeyboardCoordinates` hace que las flechas izquierda y derecha salten al centro de la columna vecina. Los anuncios para lectores de pantalla están en español.
- **`DragOverlay`:** la copia que se arrastra flota por encima de todo, así no la recorta el scroll horizontal del tablero.

### Verificación
Cada fase se validó en Edge headless, contra el backend real y contra los mocks. Los errores 400, 404 y 500 y las demoras se forzaron interceptando peticiones:

| Fase | Chequeos |
|---|---|
| 3. Componentes con `mockData` | 14 |
| 4. Rutas, sesión y estados | 18 |
| 5. Formularios y mutaciones (backend real) | 24 |
| 6. Drag & drop optimista (backend real) | 10 |
| Flujo completo solo con mocks, sin backend | 6 |
