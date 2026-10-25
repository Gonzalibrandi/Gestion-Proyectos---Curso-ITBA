# Kanban - Gestión de Proyectos (Curso ITBA)

Aplicación de gestión de proyectos al estilo Kanban, organizada como **monorepo**. La API implementa un diseño estricto de rutas anidadas que refleja la relación jerárquica **Padre → Hijo → Nieto**: `Tableros (Boards) → Columnas (Columns) → Tickets`.

## 🌐 Deploy

| Parte | Plataforma | URL |
|---|---|---|
| Frontend (SPA) | Vercel | https://gestion-proyectos-curso-itba.vercel.app |
| Backend (API REST) | Render | https://kanban-api-itba.onrender.com/api ([health check](https://kanban-api-itba.onrender.com/api/health)) |
| Base de datos | MongoDB Atlas (M0) | — |

**Usuario de prueba:** `demo@kanban.com` / `demo1234`

> El backend usa el plan gratuito de Render: después de 15 minutos sin uso se suspende, y la primera petición puede tardar ~50 s.

## Estructura del Monorepo

```
├── backend/                 # API RESTful (Node.js + Express + MongoDB)
│   └── ARQUITECTURA.md      # Decisiones de arquitectura, frameworks y librerías del backend
├── frontend/                # SPA en React + Vite (en desarrollo)
│   ├── requerimientos.md    # Especificación SDD del frontend (fuente de la verdad para el agente)
│   └── ARQUITECTURA.md      # Decisiones de arquitectura, frameworks y librerías del frontend
├── AGENTS.md                # Reglas del proyecto para agentes de IA (SDD)
├── render.yaml              # Blueprint de despliegue del backend en Render
└── README.md
```

| Documento | Contenido |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Reglas globales, reglas del backend y punto de entrada a las del frontend. |
| [`frontend/requerimientos.md`](frontend/requerimientos.md) | Stack, rutas, contrato con la API, formularios, tema visual, fases y criterios de aceptación del frontend. |
| [`backend/ARQUITECTURA.md`](backend/ARQUITECTURA.md) | Por qué se eligió cada tecnología y cómo están resueltos el modelo de datos, el usuario único, la cascada, los errores, la idempotencia y el despliegue. |
| [`frontend/ARQUITECTURA.md`](frontend/ARQUITECTURA.md) | Por qué se eligió cada librería del frontend, el manejo de estado, el tema y las limitaciones. |

## Backend (API REST)

### Tecnologías Utilizadas
- **Node.js** v24
- **Express** 4
- **MongoDB** + **Mongoose** 8
- **bcryptjs** (hash de la contraseña del usuario)
- **dotenv** y **cors**

### Requisitos Previos
- Node.js 24 (definido en `engines` del `package.json`)
- Una instancia de MongoDB: local (`mongodb://localhost:27017`) o un cluster de MongoDB Atlas

### Instalación y Configuración

1. Clonar el repositorio e instalar las dependencias del backend:
   ```bash
   git clone https://github.com/Gonzalibrandi/Gestion-Proyectos---Curso-ITBA.git
   cd Gestion-Proyectos---Curso-ITBA/backend
   npm install
   ```

2. Crear el archivo de variables de entorno a partir del ejemplo (dentro de `backend/`):
   ```bash
   cp .env.example .env
   ```

   | Variable | Descripción | Ejemplo |
   |---|---|---|
   | `PORT` | Puerto del servidor (por defecto `3000`) | `3000` |
   | `MONGO_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/kanban-itba` |
   | `CORS_ORIGIN` | Orígenes permitidos, separados por coma (si se omite, se permite cualquiera) | `http://localhost:5173` |
   | `DEMO_USER_NAME` | Nombre del usuario único | `Demo` |
   | `DEMO_USER_EMAIL` | Email del usuario único (se usa para el login) | `demo@kanban.com` |
   | `DEMO_USER_PASSWORD` | Contraseña del usuario único | `demo1234` |

3. Iniciar el servidor (desde `backend/`):
   - Desarrollo (con Nodemon): `npm run dev`
   - Producción: `npm start`

   Al arrancar, el servidor ejecuta el **seed**: si no existe ningún usuario, crea el usuario único con los datos de `DEMO_USER_*`. También se puede ejecutar a mano con `npm run seed`. Es idempotente: nunca duplica el usuario.

### Estructura del Backend
Cada capa vive en su propio módulo (Principio de Responsabilidad Única). Los archivos de rutas no tienen consultas a la base de datos ni lógica de negocio.

```
backend/
├── server.js                  # CORS, middlewares globales, rutas, conexión a MongoDB, seed y arranque
├── models/                    # Esquemas de Mongoose
│   ├── User.js                # Usuario único (contraseña con hash)
│   ├── Board.js               # ref -> User (owner)
│   ├── Column.js              # ref -> Board
│   └── Ticket.js              # ref -> Column y Board, con priority
├── controllers/               # Lógica de negocio de cada recurso
│   ├── healthController.js
│   ├── authController.js
│   ├── boardController.js
│   ├── columnController.js
│   └── ticketController.js
├── routes/                    # Routers (los de tableros, anidados con mergeParams)
│   ├── healthRoutes.js        # /api/health
│   ├── authRoutes.js          # /api/auth
│   ├── boardRoutes.js         # /api/boards
│   ├── columnRoutes.js        # /api/boards/:boardId/columns
│   └── ticketRoutes.js        # /api/boards/:boardId/columns/:columnId/tickets
├── middlewares/
│   ├── currentUser.js         # Usuario actual a partir del header X-User-Id
│   ├── parentCheck.js         # Parent Check + Aislamiento de Rutas
│   └── errorHandler.js        # 404 de rutas inexistentes y manejo global de errores
├── seed/
│   ├── seedDemoUser.js        # Crea el usuario único (idempotente)
│   └── run.js                 # Ejecución manual: npm run seed
├── utils/
│   └── validation.js          # Validación de ObjectId, textos y prioridades
├── thunder-collection.json    # Colección de pruebas para Thunder Client
├── postman_collection.json    # Colección de pruebas para Postman
├── ARQUITECTURA.md
├── .env.example
└── package.json
```

### Especificación de Endpoints

| Método | Endpoint | Acción | `X-User-Id` | Éxito |
|---|---|---|---|---|
| GET | `/api/health` | Estado del servicio (health check del despliegue). | No | 200 |
| POST | `/api/auth/login` | Login del usuario único. Devuelve `{ _id, name, email }`. | No | 200 |
| GET | `/api/boards` | Lista los tableros del usuario (del más reciente al más antiguo). | Sí | 200 |
| POST | `/api/boards` | Crea un nuevo tablero; su dueño es el usuario del header. | Sí | 201 |
| GET | `/api/boards/:boardId` | Obtiene un tablero con sus columnas (y los tickets de cada una) pobladas. | No | 200 |
| DELETE | `/api/boards/:boardId` | Elimina un tablero junto con sus columnas y tickets (cascada). | No | 204 |
| POST | `/api/boards/:boardId/columns` | Agrega una columna a un tablero. | No | 201 |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Elimina una columna junto con sus tickets (cascada). | No | 204 |
| POST | `/api/boards/:boardId/columns/:columnId/tickets` | Crea un ticket dentro de una columna. | No | 201 |
| PATCH | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Actualiza el contenido o la prioridad de un ticket y/o lo mueve de columna (idempotente). | No | 200 |
| DELETE | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Elimina un ticket. | No | 204 |

> No existen rutas planas (ej. `/api/tickets`): todo ticket nace dentro del contexto de una columna y un tablero.

#### Cuerpos de las peticiones

| Endpoint | Body | Campos obligatorios |
|---|---|---|
| `POST /api/auth/login` | `{ "email": "demo@kanban.com", "password": "demo1234" }` | `email`, `password` |
| `POST /api/boards` | `{ "name": "Proyecto Alpha", "description": "Opcional" }` | `name` |
| `POST .../columns` | `{ "name": "To Do" }` | `name` |
| `POST .../tickets` | `{ "title": "Implementar Auth", "description": "Opcional", "priority": "high" }` | `title` (`priority`: `low`, `medium` o `high`; por defecto `medium`) |
| `PATCH .../tickets/:ticketId` | `{ "title": "...", "description": "...", "priority": "low", "newColumnId": "<id de columna destino>" }` | Ninguno (se aplican solo los campos enviados) |

#### Ejemplo de respuesta: `GET /api/boards/:boardId`

```json
{
  "_id": "6ad184755d9f85d901bbb60c",
  "name": "Proyecto Alpha",
  "description": "Tablero principal del proyecto",
  "owner": "6ad184755d9f85d901bbb600",
  "createdAt": "2026-10-15T20:00:00.000Z",
  "updatedAt": "2026-10-15T20:00:00.000Z",
  "columns": [
    {
      "_id": "6ad184755d9f85d901bbb614",
      "name": "To Do",
      "board": "6ad184755d9f85d901bbb60c",
      "tickets": [
        {
          "_id": "6ad184755d9f85d901bbb61d",
          "title": "Implementar Auth",
          "description": "Configurar JWT en el backend",
          "priority": "high",
          "column": "6ad184755d9f85d901bbb614",
          "board": "6ad184755d9f85d901bbb60c"
        }
      ]
    }
  ]
}
```

### Manejo de Errores

Todas las respuestas de error respetan el formato: `{ "error": "Mensaje describiendo el error" }`.

| Código | Cuándo ocurre | Ejemplo |
|---|---|---|
| 400 | El payload falla la validación (campo obligatorio faltante, vacío, con tipo incorrecto o `priority` no permitida). | `POST .../tickets` sin `title` |
| 400 | El body no es un JSON válido. | `{ "name": ` |
| 400 | Un ID (en la URL, el body o el header `X-User-Id`) no tiene el formato de ObjectId (24 caracteres hexadecimales). | `GET /api/boards/123` |
| 400 | Aislamiento de Rutas: el recurso existe pero no pertenece al padre de la URL. | Una columna del tablero B pedida desde el tablero A |
| 401 | Credenciales incorrectas en el login. | Contraseña equivocada |
| 401 | Falta el header `X-User-Id` o el usuario indicado no existe. | `GET /api/boards` sin header |
| 404 | El ID tiene formato válido pero no existe en la base de datos. | `GET /api/boards/000000000000000000000000` |
| 404 | Parent Check: el tablero o la columna padre no existe. | `POST /api/boards/<id inexistente>/columns` |
| 404 | La ruta no existe. | `POST /api/tickets` |
| 500 | Solo ante fallas imprevistas del servidor. | — |

### Reglas de Negocio
- **Parent Check:** antes de operar sobre un hijo, los middlewares (`checkBoard`, `checkColumn`, `checkTicket`) consultan la base de datos para verificar que el padre existe. Si no existe, se aborta con 404 (nunca un 500).
- **Aislamiento de Rutas:** se valida que la columna pertenezca al tablero de la URL y que el ticket pertenezca a ese tablero y a esa columna, también al borrarlo. Tampoco se puede mover un ticket a una columna de otro tablero.
- **Borrado en Cascada:** se implementa con hooks `pre('deleteOne')` de Mongoose. Eliminar un tablero elimina sus columnas y tickets, y eliminar una columna elimina sus tickets. Los controladores usan `documento.deleteOne()` para que los hooks se disparen.
- **Referencias, no arrays:** las relaciones se modelan con referencias (`ObjectId` + `ref`), y las columnas y tickets se obtienen con *virtual populate*.
- **Idempotencia del PATCH:** solo se escriben en la base los campos que realmente cambian. Si se reintenta un `PATCH` que ya movió el ticket (por ejemplo, por una falla de red), la API responde `200` con el mismo ticket, sin duplicar datos ni modificar nada.
- **Prioridad:** todo ticket tiene `priority` (`low`, `medium` o `high`, por defecto `medium`).
- **Usuario único simulado:** la colección `users` tiene un solo usuario, creado por el seed. El login lo valida y devuelve su `_id`, que el cliente envía en `X-User-Id`. Los tableros nuevos quedan a su nombre y `GET /api/boards` lista solo los suyos. **No es autenticación real:** no hay token.

### Pruebas (Collections)
El backend incluye dos colecciones equivalentes en `backend/`, con **42 peticiones y asserts automáticos** (código HTTP esperado y formato `{ error }`), organizadas en cuatro carpetas:

0. **Health y Login:** health check, errores de login (400 y 401) y login del usuario único.
1. **Flujo principal:** crear y listar tableros, crear columnas y tickets (con y sin prioridad), obtener el tablero poblado, actualizar, mover, reintentar el movimiento (idempotencia) y eliminar un ticket.
2. **Validaciones y errores:** casos 400 (payload inválido, prioridad inválida, JSON malformado, ID inválido, aislamiento), 401 (sin `X-User-Id` o usuario inexistente) y 404 (Parent Check, recurso inexistente).
3. **Borrado en cascada:** eliminar una columna o un tablero y verificar que sus hijos también se eliminaron.

El login guarda `userId`, y los IDs que se crean se guardan automáticamente en variables (`boardId`, `columnId`, `newColumnId`, `ticketId`, ...), así que **la colección se ejecuta completa y en orden** sin copiar y pegar nada. Las credenciales del login son las de `.env.example` (`demo@kanban.com` / `demo1234`); si usás otras en tu `.env`, actualizalas en la request de login.

- **Postman:** importar `backend/postman_collection.json` y ejecutar *Run collection*. Las variables viven en la colección (`baseUrl` = `http://localhost:3000`).
- **Thunder Client:** importar `backend/thunder-collection.json`, activar un entorno (por ejemplo, uno vacío llamado `Kanban Local`) para que se guarden los IDs y ejecutar *Run All*.
- **Terminal:** `npx newman run postman_collection.json` (desde `backend/`).

### Despliegue (Render + MongoDB Atlas)

1. **Base de datos en MongoDB Atlas:**
   - Crear un cluster gratuito **M0**.
   - Crear un usuario de base de datos. Usar una contraseña sin símbolos como `@`, `#` o `/`, porque rompen la URI.
   - En *Network Access*, permitir `0.0.0.0/0`: Render no tiene una IP fija.
   - Copiar la URI de conexión y agregarle el nombre de la base antes del `?` (por ejemplo, `.../kanban-itba?retryWrites=true&w=majority`).
2. **Backend en Render:** en Render, *New +* → **Blueprint** → elegir este repositorio. Render lee `render.yaml` (servicio `kanban-api-itba`, carpeta `backend`, health check en `/api/health`) y pide las variables:
   - `MONGO_URI`: la URI de Atlas.
   - `CORS_ORIGIN`: la URL del frontend en Vercel (por ejemplo, `https://<proyecto>.vercel.app`).
   - `DEMO_USER_NAME`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`: los datos del usuario único.
3. **Verificar:** `https://<servicio>.onrender.com/api/health` debe responder `{ "status": "ok" }`. Para probar la API desplegada, correr la colección de Postman cambiando `baseUrl` por esa URL.

> El plan gratuito de Render suspende el servicio después de 15 minutos sin uso, y la primera petición puede tardar ~50 s.

## Frontend (SPA)

> **Fases 1 a 6 completadas** (ver [`frontend/requerimientos.md`](frontend/requerimientos.md), §13). Funcionalidades:
> - Login del usuario único, con rutas protegidas.
> - Lista de tableros, con alta y baja.
> - Tablero Kanban con columnas y tickets: alta, edición, baja y prioridad.
> - Drag & drop con actualización optimista, con mouse o teclado.
> - Tema "Minimalismo Developer" light/dark persistente.
>
> **7 - Despliegue** completado: frontend en Vercel, backend en Render y base de datos en MongoDB Atlas (ver [Deploy](#-deploy)).

### Tecnologías Utilizadas
- **React 19** + **Vite 8** (JavaScript)
- **React Router 7**, **TanStack Query 5**, **Axios**
- **React Hook Form** + **Zod**, **@dnd-kit**, **sonner**, **MSW** (mocks)
- **CSS Modules** + variables CSS (tokens del tema)

Los motivos de cada elección están en [`frontend/ARQUITECTURA.md`](frontend/ARQUITECTURA.md).

### Instalación y Scripts
Desde `frontend/`:
```bash
npm install
cp .env.example .env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api` |
| `VITE_USE_MOCKS` | `true` para usar datos simulados (MSW) sin backend; el usuario de demo es `demo@kanban.com` / `demo1234` | `false` |

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` localmente |
| `npm run lint` | Lint con `oxlint` |
