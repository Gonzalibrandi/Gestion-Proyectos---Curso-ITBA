# Requerimientos del Frontend (Especificación SDD)

> **Para el agente de IA:** este documento es la **fuente de la verdad** del frontend. Leelo completo **antes de cada incremento** sobre `frontend/` y respetalo. Si un pedido lo contradice, avisá la contradicción antes de escribir código en lugar de resolverla por tu cuenta. Si una decisión cambia, actualizá este archivo y `frontend/ARQUITECTURA.md` en el mismo incremento.

## 1. Objetivo
Construir una **Single Page Application (SPA)** Kanban que consuma la API REST de `backend/`. Permite gestionar tableros, columnas y tickets, y mover tickets entre columnas arrastrándolos.

## 2. Stack Fijo

| Área | Tecnología | Regla |
|---|---|---|
| Lenguaje | JavaScript (`.js` / `.jsx`) | Sin TypeScript. |
| Runtime de desarrollo | Node.js v24.13.0 | La misma versión que el backend. |
| Build / Dev server | Vite (última versión estable al crear el proyecto) | Proyecto creado con la plantilla `react`. |
| UI | React 19 (cumple "React 18+") | Solo componentes funcionales y hooks. |
| Ruteo | React Router 7 (paquete `react-router-dom`, API compatible con v6) | Configuración centralizada en `src/routes/`. |
| Estado del servidor | TanStack Query v5 | Toda lectura y mutación de datos de la API pasa por TanStack Query. |
| Cliente HTTP | Axios | Una única instancia configurada en `src/api/httpClient.js`. |
| Estado global de UI | Context API | Solo para **tema** y **sesión**. Nada de Redux, Zustand ni similares. |
| Formularios | React Hook Form + Zod (`@hookform/resolvers`) | Todo formulario usa un esquema Zod. |
| Drag & Drop | `@dnd-kit/core` | Con `PointerSensor` y `KeyboardSensor` (accesible con teclado). |
| Notificaciones | `sonner` (Toasts) | Un único `<Toaster />` montado en la raíz (`AppToaster`), que sigue el tema actual de la app. |
| Mocks | MSW 2 (Mock Service Worker) | Solo en desarrollo, activado por variable de entorno. |
| Estilos | CSS Modules + CSS Custom Properties | Sin Tailwind, Bootstrap ni librerías de componentes. |
| Lint | `oxlint` (incluido en la plantilla de Vite) | `npm run lint` tiene que terminar sin errores antes de cerrar cada fase. |

Las versiones exactas quedan fijadas en `frontend/package.json` (detalle y motivos en `frontend/ARQUITECTURA.md`, §12).

## 3. Estructura de Directorios

```
frontend/
├── index.html                 # Incluye el script anti-parpadeo del tema (ver §10.2)
├── .env.example               # VITE_API_URL y VITE_USE_MOCKS
├── vercel.json                # Rewrite de la SPA para el despliegue en Vercel (ver §11.2)
├── package.json
└── src/
    ├── main.jsx               # Punto de entrada: providers (QueryClient, Theme, Auth), Toaster y MSW
    ├── api/                   # Funciones aisladas de llamada a los endpoints REST (Axios)
    │   ├── httpClient.js      # Instancia de Axios, header X-User-Id y normalización de errores (ApiError)
    │   ├── ApiError.js        # Clase de error uniforme { status, message }
    │   ├── session.js         # Lectura y escritura de la sesión en localStorage (kanban.session)
    │   ├── authService.js
    │   ├── boardService.js
    │   ├── columnService.js
    │   └── ticketService.js
    ├── components/            # UI reutilizable y agnóstica del dominio (Button, Input, Modal, ConfirmDialog,
    │                          # Form, Spinner, StateMessage, AppHeader, AppToaster, ThemeToggle)
    ├── features/              # Módulos por dominio
    │   ├── auth/              # LoginForm, useLogin y esquema del login
    │   ├── boards/            # Componentes, hooks de queries/mutations, esquemas Zod y queryKeys.js
    │   ├── columns/
    │   └── tickets/           # Además: priorities.js (valores y etiquetas) y dnd.js (teclado y anuncios del drag & drop)
    ├── context/               # ThemeContext/ThemeProvider y AuthContext/AuthProvider (estado global de UI)
    ├── hooks/                 # Custom hooks transversales (useTheme, useAuth, useServerError)
    ├── utils/                 # Funciones puras transversales (toastApiError)
    ├── mocks/                 # mockData.js (datos), db.js (estado en memoria), rules.js (validaciones del backend),
    │                          # handlers.js (MSW) y browser.js. El worker de MSW vive en public/mockServiceWorker.js
    ├── pages/                 # Vistas asociadas a rutas (contenedores). BoardDetailDialogs.jsx es un contenedor
    │                          # auxiliar de BoardDetailPage (sus formularios y confirmaciones)
    ├── routes/                # router.jsx, ProtectedRoute.jsx y AppLayout.jsx (rutas de layout)
    └── styles/                # tokens.css (variables del tema) y global.css (reset y base)
```

Cada carpeta de `features/<dominio>/` sigue la misma organización:
- `components/`: componentes presentacionales del dominio (por ejemplo, `TicketCard.jsx`, `ColumnView.jsx`, `BoardForm.jsx`).
- `hooks/`: hooks de TanStack Query del dominio (por ejemplo, `useBoard.js`, `useMoveTicket.js`).
- `schemas.js`: esquemas Zod de los formularios del dominio.

Convenciones de archivos:
- **Contextos:** cada uno se divide en `XContext.js` (solo `createContext`) y `XProvider.jsx` (solo el componente), y se consume con un hook de `hooks/` (por ejemplo, `useTheme`). Así Fast Refresh sigue funcionando, porque cada `.jsx` exporta solo componentes.
- **Componentes:** cada uno tiene su `.jsx` y su `.module.css` con el mismo nombre (por ejemplo, `ThemeToggle.jsx` y `ThemeToggle.module.css`), y se exporta con export nombrado.
- Las carpetas que todavía no tienen archivos llevan un `.gitkeep` para que git las registre.

## 4. Patrón de Componentes

| Tipo | Ubicación | Puede | NO puede |
|---|---|---|---|
| **Presentacional** ("tonto") | `components/`, `features/*/components/` | Recibir datos y callbacks por props, renderizar UI y tener estado puramente visual (abierto/cerrado, hover). Los formularios pueden usar `useForm` de React Hook Form. | Usar `useEffect` para traer datos, importar servicios de `src/api`, usar TanStack Query ni navegar. |
| **Contenedor / Página** | `pages/` | Usar los hooks de `features/*/hooks`, `useParams`, `useNavigate`, mostrar Toasts y pasar datos y callbacks a los presentacionales. | Llamar a Axios directamente: siempre lo hace a través de los hooks y servicios. |

- Los formularios presentacionales reciben por props: `onSubmit`, `isSubmitting` y `serverError`. `serverError` es el `ApiError` de la mutación (o `null`), no solo el mensaje: así dos fallos seguidos con el mismo texto vuelven a mostrarse. El hook `useServerError` lo asigna al campo con `setError`.
- Los presentacionales pueden renderizar `<Link>` (navegación declarativa pura, por ejemplo abrir un tablero), pero nunca usar `useNavigate`.
- Los presentacionales pueden usar los hooks de `@dnd-kit` (`useDraggable`, `useDroppable`), porque son comportamiento de UI. La lógica de qué pasa al soltar vive en la página.
- Los callbacks de acción son opcionales: si la página no pasa, por ejemplo, `onDelete`, el botón no se muestra.
- Los componentes se mantienen chicos y con una sola responsabilidad. Si un archivo supera las ~150 líneas, se divide.

## 5. Matriz de Rutas (SPA)

| Ruta | Componente | Acceso | Descripción / Requerimiento |
|---|---|---|---|
| `/login` | `LoginPage` | Público | Formulario de login del usuario único (ver §6). Si ya hay sesión, redirige a `/boards`. |
| `/boards` | `BoardsListPage` | Protegido | Lista de tableros **del usuario**. Permite crear un tablero y eliminarlo (con confirmación). |
| `/boards/:boardId` | `BoardDetailPage` | Protegido | Vista principal Kanban. Carga el tablero con sus columnas y tickets anidados. Permite crear y eliminar columnas; crear, editar, eliminar y mover tickets. |
| `/` | — | — | Redirige a `/boards`. |
| `*` | `NotFoundPage` | Público | Página 404 con un enlace para volver a `/boards`. |

- **Rutas protegidas:** se envuelven en `ProtectedRoute`. Si no hay sesión, redirige a `/login` y guarda la ruta original en `location.state.from` para volver después del login.
- **Límite negativo (React Router):** NO usar `<Link>` para acciones de mutación (crear, borrar o mover). `<Link>` solo sirve para navegación pura (por ejemplo, abrir un tablero). Usar navegación programática (`useNavigate`) **únicamente después** de que la mutación en la API haya sido exitosa:
  - Crear un tablero → navegar a `/boards/:boardId` del tablero creado.
  - Eliminar un tablero desde su detalle → navegar a `/boards`.
- Un `boardId` inválido (400) o inexistente (404) en `BoardDetailPage` muestra un estado de error con un botón para volver a `/boards`. Nunca muestra una pantalla en blanco.

## 6. Usuario Único y Sesión Simulada
El backend tiene **un único usuario**, guardado en la colección `users` y creado por un seed. El login se valida contra ese usuario, pero la sesión es **simulada**: no hay token.
- `LoginPage` pide `email` y `password`, validados con Zod (email válido y contraseña requerida), y llama a `authService.login`.
- Si el login es exitoso, el backend devuelve `{ _id, name, email }`. `AuthContext` lo guarda en `localStorage`, con la clave `kanban.session`, y navega a la ruta original (o a `/boards`).
- Si las credenciales son incorrectas (`401`), el mensaje del backend se muestra en el formulario, sin recargar la página.
- El interceptor de Axios envía el `_id` de la sesión en el header **`X-User-Id`** en cada petición. El backend lo usa para asignar el dueño de los tableros nuevos y para listar solo los tableros del usuario.
- Si la API responde `401` fuera del login (sesión inexistente o vieja), se borra la sesión y se redirige a `/login`.
- El header de la app muestra el **nombre** del usuario y un botón **Cerrar sesión**, que borra la sesión y navega a `/login`.
- Esto **no es seguridad real**: cualquiera que conozca el `_id` puede usar la API. Así debe quedar documentado en `frontend/ARQUITECTURA.md`.

## 7. Contrato con la API (Capa `src/api`)

### 7.1 Configuración
- La URL base se lee **exclusivamente** de `import.meta.env.VITE_API_URL` (por ejemplo, `http://localhost:3000/api`). Está prohibido escribir URLs a mano en el código.
- `httpClient.js` crea la instancia de Axios con dos interceptores:
  - **De petición:** si hay sesión, agrega el header `X-User-Id` con el `_id` del usuario.
  - **De respuesta:** transforma cualquier fallo en un `ApiError` con:
    - `status`: el código HTTP, o `0` si no hubo respuesta (falla de red).
    - `message`: el campo `error` del body del backend, o `"No se pudo conectar con el servidor"` si hubo falla de red.
- Los servicios devuelven directamente `response.data` y propagan el `ApiError` (no capturan errores en silencio).
- Cada servicio se exporta como un objeto con sus funciones (`boardService.getBoardById(...)`). Los IDs se codifican con `encodeURIComponent` al armar las URLs.
- El timeout de Axios es de **90 s** (cubre el arranque en frío de Render, ver §11.2).
- **401 fuera del login:** el interceptor borra la sesión (`session.js`) y llama al callback registrado con `setUnauthorizedHandler(fn)`. En la Fase 4, `AuthProvider` registra ese callback para limpiar su estado y redirigir a `/login`. Así `httpClient` no depende del router.

### 7.2 Funciones de servicio

| Servicio | Función | Endpoint | Éxito |
|---|---|---|---|
| `authService` | `login({ email, password })` | `POST /auth/login` **(nuevo, ver §7.3)** | 200 |
| `boardService` | `getBoards()` | `GET /boards` **(nuevo, ver §7.3)** | 200 |
| `boardService` | `createBoard({ name, description })` | `POST /boards` (asigna como dueño al usuario de `X-User-Id`) | 201 |
| `boardService` | `getBoardById(boardId)` | `GET /boards/:boardId` | 200 |
| `boardService` | `deleteBoard(boardId)` | `DELETE /boards/:boardId` | 204 |
| `columnService` | `createColumn(boardId, { name })` | `POST /boards/:boardId/columns` | 201 |
| `columnService` | `deleteColumn(boardId, columnId)` | `DELETE /boards/:boardId/columns/:columnId` | 204 |
| `ticketService` | `createTicket(boardId, columnId, { title, description, priority })` | `POST /boards/:boardId/columns/:columnId/tickets` | 201 |
| `ticketService` | `updateTicket(boardId, columnId, ticketId, { title?, description?, priority?, newColumnId? })` | `PATCH /boards/:boardId/columns/:columnId/tickets/:ticketId` | 200 |
| `ticketService` | `deleteTicket(boardId, columnId, ticketId)` | `DELETE /boards/:boardId/columns/:columnId/tickets/:ticketId` **(nuevo, ver §7.3)** | 204 |

- Para mover un ticket, el `columnId` de la URL es la **columna de origen** y `newColumnId` va en el body.
- La forma de los datos es la que devuelve el backend: `_id`, `name` o `title`, `description`, `priority` (solo tickets), `owner` (solo tableros), `board`, `column`, `createdAt` y `updatedAt`. `GET /boards/:boardId` devuelve `columns[]`, y cada columna trae su `tickets[]`.
- `priority` toma uno de estos valores: `low`, `medium` o `high` (por defecto `medium`). En la UI se muestran como **Baja**, **Media** y **Alta**.

### 7.3 Cambios en el backend (prerrequisito, Fase 0) — ✅ Implementados
El contrato original del backend no cubría todo lo que necesita la UI. Estos cambios ya están implementados en `backend/` y verificados con la colección de pruebas (42 peticiones en verde):

| Cambio | Detalle | Éxito | Errores |
|---|---|---|---|
| Modelo `User` + seed | Un único usuario (`name`, `email`, contraseña con hash) creado desde las variables `DEMO_USER_*`. El seed es idempotente y se ejecuta al arrancar y con `npm run seed`. | — | — |
| `POST /api/auth/login` | Valida email y contraseña y devuelve `{ _id, name, email }`. | 200 | 400 (payload inválido) / 401 (credenciales incorrectas) |
| Header `X-User-Id` | Middleware que identifica al usuario actual en los endpoints que lo requieren. | — | 400 (formato inválido) / 401 (ausente o inexistente) |
| `Board.owner` | `POST /api/boards` asigna como dueño al usuario actual. | 201 | 401 (sin usuario) |
| `GET /api/boards` | Lista los tableros del usuario actual, sin poblar, del más reciente al más antiguo. | 200 | 401 (sin usuario) |
| `Ticket.priority` | `low`, `medium` o `high`, por defecto `medium`. Se acepta en el `POST` y en el `PATCH` de tickets. | — | 400 (valor no permitido) |
| `DELETE /api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Elimina un ticket. | 204 | 400 (ID inválido o aislamiento) / 404 (no existe) |
| `GET /api/health` | Health check para el despliegue. | 200 | — |
| CORS por entorno | Orígenes permitidos desde `CORS_ORIGIN`. | — | — |

## 8. Formularios y Validación

| Formulario | Ubicación | Esquema Zod | Campo que recibe el error del servidor |
|---|---|---|---|
| Login | `LoginPage` | `email` (email válido), `password` (requerido) | Error general del formulario (`root`), para el `401` de credenciales incorrectas |
| Crear tablero | `BoardsListPage` (en un `Modal`) | `name` (texto requerido, sin espacios en los extremos), `description` (opcional) | `name` |
| Crear columna | `BoardDetailPage` | `name` (requerido) | `name` |
| Crear / editar ticket | `BoardDetailPage` (en un `Modal`) | `title` (requerido), `description` (opcional), `priority` (`z.enum(['low', 'medium', 'high'])`, por defecto `medium`, elegida con un `<select>`) | `title` |

- **Validación en cliente:** con React Hook Form y `zodResolver`. Los mensajes se muestran debajo de cada input.
- **Errores del servidor:**
  - Ante un `400 Bad Request`, el `message` del `ApiError` se asigna con `setError('<campo>', { type: 'server', message })` al campo indicado en la tabla. Se muestra como alerta visual del input, **sin recargar la página**.
  - Cualquier otro error (404, 500 o falla de red) se muestra con un Toast de error.
- **Estados de carga (UX Feedback):** todo formulario o botón que dispare un `POST`, `PATCH` o `DELETE` debe:
  - Deshabilitarse mientras la petición esté en curso (`disabled={isSubmitting}` o `disabled={mutation.isPending}`).
  - Mostrar un `Spinner` mientras tanto.
- **Confirmación de borrado:** eliminar un tablero o una columna pide confirmación en un `Modal`, que avisa que el borrado es **en cascada**. Eliminar un ticket también pide confirmación.

## 9. Estado del Servidor y Sincronización

### 9.1 Queries (TanStack Query)
| Query key | Servicio | Usada en |
|---|---|---|
| `['boards']` | `getBoards()` | `BoardsListPage` |
| `['board', boardId]` | `getBoardById(boardId)` | `BoardDetailPage` |

Todas las páginas que leen datos muestran los tres estados: **loading** (spinner o esqueleto), **error** (mensaje + acción para reintentar o volver) y **data**.

Al cerrar sesión se limpia la caché de TanStack Query (`queryClient.clear()`), para no mostrar datos de una sesión anterior.

### 9.2 Mutaciones: Petición Estándar
Crear o eliminar tableros, crear o eliminar columnas, y crear, editar o eliminar tickets: se espera la respuesta exitosa y después se invalida la query afectada (`['boards']` o `['board', boardId]`) para refrescar la UI.

### 9.3 Mover un ticket: Actualización Optimista (Optimistic UI)
Mover un ticket a otra columna (soltarlo con drag & drop) usa una **actualización optimista**:
1. `onMutate`: se cancelan las queries de `['board', boardId]`, se guarda una copia del estado actual y se mueve el ticket en la caché con `setQueryData`. La UI cambia al instante.
2. `onError` (por ejemplo, `400` o `404`): se restaura la copia, el ticket **vuelve a su columna original** y se muestra un **Toast** que avisa del fallo.
3. `onSettled`: se invalida `['board', boardId]` para sincronizar con el servidor.

Además:
- Soltar un ticket en su misma columna **no dispara ninguna petición**.
- **No se soporta reordenar tickets dentro de una columna:** el backend no tiene un campo de orden.
- El `PATCH` del backend es idempotente, así que reintentar un movimiento es seguro.

## 10. Tema Visual: "Minimalismo Developer"
Estilo inspirado en IDEs y terminales. Prioriza el contraste y la jerarquía de la información por sobre la decoración: bordes finos, sombras mínimas, nada de gradientes.

### 10.1 Tokens de diseño (`src/styles/tokens.css`)

| Token | Light | Dark | Origen |
|---|---|---|---|
| `--bg-primary` | `#F9FAFB` | `#0F172A` | Consigna |
| `--bg-card` | `#FFFFFF` | `#1E293B` | Consigna |
| `--text-primary` | `#111827` | `#F8FAFC` | Consigna |
| `--accent-color` | `#4F46E5` | `#818CF8` | Consigna |
| `--text-secondary` | `#6B7280` | `#94A3B8` | Derivado |
| `--border-color` | `#E5E7EB` | `#334155` | Derivado |
| `--danger-color` | `#DC2626` | `#F87171` | Derivado (errores y borrados) |
| `--text-on-accent` | `#FFFFFF` | `#0F172A` | Derivado (texto sobre fondo de acento, con contraste en ambos temas) |
| `--shadow-card` | sombra mínima | `none` | Derivado (en dark, las tarjetas se separan solo por el borde) |
| `--overlay-color` | gris oscuro translúcido | negro translúcido | Derivado (fondo detrás de los modales) |
| `--font-sans` | `system-ui, sans-serif` | (igual) | Texto general |
| `--font-mono` | `ui-monospace, "Cascadia Code", Consolas, monospace` | (igual) | IDs, contadores y metadatos |

- Los valores light se definen en `:root` y los dark en `:root.dark`.
- **Está prohibido escribir colores hexadecimales fuera de `tokens.css`.** Los componentes solo usan `var(--token)`.
- `tokens.css` también centraliza el espaciado (`--space-1` a `--space-8`), los radios (`--radius-sm`, `--radius-md`) y la duración de la transición del tema (`--transition-theme`). Los componentes usan esos tokens en lugar de valores sueltos.
- **Prioridad del ticket:** `TicketCard` la muestra como una etiqueta (con `--font-mono`) que reutiliza tokens existentes, sin agregar colores nuevos: `low` usa `--text-secondary`, `medium` usa `--accent-color` y `high` usa `--danger-color`.

### 10.2 Interruptor de tema (Light/Dark)
- **Preferencia del sistema:** si el usuario nunca eligió un tema, se usa `window.matchMedia('(prefers-color-scheme: dark)')`, y la app sigue los cambios del sistema mientras no haya una elección manual.
- **Elección manual:** el `ThemeToggle` del header agrega o quita la clase `.dark` en `<html>` y guarda la preferencia en `localStorage`, con la clave `kanban.theme` (`"light"` o `"dark"`).
- **Sin parpadeo:** un script inline en el `<head>` de `index.html` lee `localStorage` y la media query, y aplica la clase `.dark` **antes** de que React se monte.
- El estado del tema vive en `ThemeContext`, y los componentes lo leen con `useTheme()`.

## 11. Variables de Entorno, Mocks y Despliegue

### 11.1 Variables de entorno y mocks

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | URL base de la API (único lugar donde se define). |
| `VITE_USE_MOCKS` | `false` | Con `true`, en desarrollo se inicia MSW y las peticiones se responden con datos simulados. |

- `src/mocks/mockData.js` contiene datos sintéticos con **la misma forma** que las respuestas del backend: `_id` de 24 caracteres hexadecimales, timestamps, `priority`, `owner` y columnas y tickets anidados. Incluye el usuario único de demo.
- `src/mocks/handlers.js` implementa **todos** los endpoints de §7.2 sobre un estado en memoria, incluido el login y el header `X-User-Id`, con los mismos códigos de éxito y de error, y el mismo formato `{ "error": "..." }`.
- `src/mocks/rules.js` replica **los mismos mensajes y el mismo orden de validación** que el backend (formato → existencia → pertenencia). Si el backend cambia un mensaje o una regla, hay que actualizar este archivo en el mismo incremento.
- Las credenciales del usuario de demo en los mocks son las de `backend/.env.example` (`demo@kanban.com` / `demo1234`). Los datos se reinician al recargar la página.
- MSW nunca se incluye en el build de producción: `main.jsx` lo importa dinámicamente solo si `import.meta.env.DEV` y `VITE_USE_MOCKS === 'true'`. El archivo `public/mockServiceWorker.js` (generado con `npx msw init public`) se copia a `dist/`, pero en producción nunca se registra.

### 11.2 Despliegue (Vercel)
El frontend tiene que poder desplegarse en **Vercel** sin cambios de código:
- **Configuración del proyecto en Vercel:** *Root Directory* `frontend`, *Build Command* `npm run build`, *Output Directory* `dist`.
- **Variables:** `VITE_API_URL` apunta a la URL del backend en Render (por ejemplo, `https://<servicio>.onrender.com/api`). Vite la incorpora **en el momento del build**, así que cambiarla requiere volver a desplegar.
- **Rutas de la SPA:** `frontend/vercel.json` reescribe todas las rutas a `index.html` (`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`). Así, recargar `/boards/:boardId` no devuelve 404.
- **CORS:** la URL pública del frontend tiene que estar en `CORS_ORIGIN` del backend.
- **Arranque en frío:** el plan gratuito de Render suspende el backend tras 15 minutos sin uso, y la primera petición puede tardar ~50 s. Los estados de loading tienen que cubrir esa espera sin dar error por timeout (no configurar un timeout de Axios menor a 60 s).

## 12. Límites Negativos (Reglas Estrictas de "NO HACER")
- **NO** usar `fetch` ni Axios dentro de componentes o páginas: solo en `src/api`, y consumidos a través de hooks de TanStack Query.
- **NO** usar `useEffect` + `useState` para traer datos de la API: eso lo resuelve TanStack Query.
- **NO** guardar datos del servidor (tableros, columnas, tickets) en Context ni en `localStorage`: viven en la caché de TanStack Query.
- **NO** usar `<Link>` para mutaciones, ni navegar antes de que la mutación haya terminado bien.
- **NO** escribir colores hexadecimales ni URLs de la API fuera de `tokens.css` y `.env`.
- **NO** agregar librerías fuera del stack fijo (§2) sin actualizar antes este documento y `ARQUITECTURA.md`.
- **NO** implementar el reordenamiento de tickets dentro de una columna.
- **NO** generar el frontend entero en un solo prompt: seguir las fases de §13.

## 13. Implementación Paso a Paso (Partición Generativa)
Cada fase se pide en un prompt separado y se revisa y valida antes de avanzar a la siguiente:

| Fase | Alcance | Validación |
|---|---|---|
| **0. Backend** ✅ | Implementar todos los cambios de §7.3 (usuario único y seed, login, `X-User-Id`, `owner`, `GET /api/boards`, `priority`, `DELETE` de tickets, health check y CORS por entorno), además de `render.yaml`: primero las colecciones de prueba y después el código. | Colección completa en verde. |
| **1. Scaffold** ✅ | Crear el proyecto Vite, instalar el stack (§2), armar la estructura de carpetas (§3), `tokens.css`, `ThemeContext`, script anti-parpadeo, `.env.example` y `vercel.json`. | La app arranca, el interruptor de tema funciona y persiste, y `npm run build` genera `dist/`. |
| **2. Capa API + Mocks** ✅ | `httpClient.js` (con los dos interceptores), los 4 servicios (§7) y MSW (§11.1). | Con `VITE_USE_MOCKS=true` los servicios responden; contra el backend real, también. |
| **3. Componentes atómicos** ✅ | `components/` y `features/*/components/`: presentacionales puros, sin API ni `useEffect` de datos. | Se renderizan con datos de `mockData.js`. |
| **4. Rutas y Páginas** ✅ | `router.jsx`, `ProtectedRoute`, `AuthContext`, `LoginPage`, `BoardsListPage`, `BoardDetailPage` y `NotFoundPage`, con queries y estados de loading, error y data. | Navegación completa y rutas protegidas. |
| **5. Formularios y Mutaciones** ✅ | Formularios con React Hook Form + Zod, errores del servidor en los inputs, spinners, confirmaciones y Toasts (§8 y §9.2). | Crear y borrar funciona, y los errores 400 aparecen en el input. |
| **6. Drag & Drop optimista** ✅ | Mover tickets con `@dnd-kit`, con actualización optimista y rollback (§9.3). | Mover es instantáneo; si se fuerza un error, el ticket vuelve a su columna y aparece el Toast. |
| **7. Cierre y Despliegue** ✅ | Revisar los criterios de aceptación (§14), desplegar backend (Render) y frontend (Vercel) siguiendo §11.2, y actualizar `README.md` y `ARQUITECTURA.md`. | Checklist completo y la app funciona con las URLs públicas. |

## 14. Criterios de Aceptación
- [x] Sin sesión, `/boards` y `/boards/:boardId` redirigen a `/login`; después del login, se vuelve a la ruta original.
- [x] El login funciona con el usuario único; con credenciales incorrectas, el mensaje del backend aparece en el formulario.
- [x] Se pueden listar, crear y eliminar tableros (con confirmación de borrado en cascada), y la lista muestra solo los tableros del usuario.
- [x] Cada ticket muestra su prioridad (Baja, Media o Alta), que se puede elegir al crearlo y al editarlo.
- [x] El detalle del tablero muestra columnas y tickets anidados, con estados de loading, error y data.
- [x] Se pueden crear y eliminar columnas, y crear, editar y eliminar tickets.
- [x] Mover un ticket entre columnas se refleja al instante; ante un error, vuelve a su columna y aparece un Toast.
- [x] Un `400` del backend se muestra debajo del input correspondiente, sin recargar la página.
- [x] Todo botón de mutación se deshabilita y muestra un spinner mientras la petición está en curso.
- [x] El tema inicial respeta la preferencia del sistema; la elección manual persiste al recargar y no hay parpadeo.
- [x] No hay colores hexadecimales fuera de `tokens.css` ni URLs de la API fuera de `.env`.
- [x] Con `VITE_USE_MOCKS=true`, la app funciona sin el backend.
- [x] Ningún componente presentacional importa algo de `src/api` ni usa TanStack Query.
- [x] Desplegado en Vercel, recargar cualquier ruta de la SPA funciona y la app se comunica con el backend en Render.
