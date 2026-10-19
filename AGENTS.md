# AGENTS.md

## Resumen del Proyecto
Aplicación de Gestión de Proyectos estilo Kanban organizada como **monorepo**:
- **`backend/`**: API REST (Node.js + Express + MongoDB). Implementa un CRUD RESTful con rutas anidadas que reflejan estrictamente la relación jerárquica entre Tableros (Boards), Columnas (Columns) y Tickets (Padre-Hijo-Nieto).
- **`frontend/`**: SPA en React + Vite que consume esa API.

Cada carpeta es un proyecto independiente con su propio `package.json`; los comandos `npm` se ejecutan dentro de cada una. La raíz solo contiene `AGENTS.md`, `README.md`, `.gitignore` y `render.yaml` (despliegue del backend).

## Documentos de Referencia Obligatorios
| Documento | Cuándo leerlo |
|---|---|
| `frontend/requerimientos.md` | **SIEMPRE antes de cualquier cambio en `frontend/`.** Es la fuente de la verdad del frontend (stack, rutas, contratos, tema, fases y límites negativos) y tiene prioridad ante cualquier duda. |
| `frontend/ARQUITECTURA.md` | Para entender el porqué de las decisiones del frontend. Actualizarlo si una decisión cambia. |
| `backend/ARQUITECTURA.md` | Para entender el porqué de las decisiones del backend. Actualizarlo si una decisión cambia. |

## Reglas Generales del Monorepo
- **Conventional Commits** en español (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`). Un commit por cambio lógico; no mezclar cambios de `backend/` y `frontend/` salvo que sean parte del mismo contrato.
- **Contrato primero:** si el frontend necesita un endpoint nuevo, primero se agrega a la tabla de endpoints de este archivo y a las colecciones de prueba del backend, luego se implementa en el backend y recién después se consume desde el frontend.
- **Siempre desplegable:** toda configuración que cambia entre entornos (URLs, orígenes CORS, credenciales, cadena de conexión) se lee de variables de entorno. Cada proyecto mantiene su `.env.example` actualizado.
- **NO** versionar archivos `.env`, `node_modules/` ni el material del curso (consignas y PDFs).

---

# Frontend
Todas las reglas del frontend están en **`frontend/requerimientos.md`** y son de cumplimiento obligatorio. Resumen de lo innegociable:
- Stack fijo: React + Vite + React Router + TanStack Query + Axios + React Hook Form/Zod + CSS Modules. No agregar librerías fuera del stack sin actualizar `requerimientos.md`.
- Separación estricta entre componentes **presentacionales** y **contenedores/páginas**; las llamadas HTTP solo existen en `src/api`.
- La URL de la API sale exclusivamente de `import.meta.env.VITE_API_URL`; los colores, exclusivamente de los tokens de `src/styles/tokens.css`.
- Implementar por fases (sección "Implementación Paso a Paso" de `requerimientos.md`), nunca todo el frontend en un solo prompt.

---

# Backend

## Stack Tecnológico
- **Node.js**: v24.13.0
- **Framework**: Express 4.x (`^4.21.0`). Al ser Express 4, los errores de funciones `async` NO se propagan solos: cada controlador debe capturarlos con `try/catch` y llamar a `next(error)`.
- **Base de Datos / ORM**: MongoDB con Mongoose 8.x (`^8.7.0`)
- **Utilidades**: `dotenv` (variables de entorno), `cors` y `bcryptjs` (hash de la contraseña del usuario).

## Convenciones y Patrones Arquitectónicos
- **Principio de Responsabilidad Única (SRP)**: Separar estrictamente las responsabilidades. Mantener Modelos, Controladores y Rutas en sus propios módulos aislados.
- **Sin lógica de BD en las Rutas**: Nunca colocar consultas a la base de datos o lógica de negocio dentro de los archivos de definición de rutas.
- **Diseño RESTful**: Usar rutas anidadas (ej. `/api/boards/:boardId/columns/:columnId/tickets`). NO usar rutas planas (ej. `/api/tickets`) para crear elementos.
- **Estructura de carpetas del backend**: `backend/models/` (esquemas), `backend/controllers/` (lógica de negocio), `backend/routes/` (solo definición de rutas y encadenado de middlewares), `backend/middlewares/` (Parent Check, Aislamiento, usuario actual y manejo global de errores), `backend/utils/` (validaciones reutilizables), `backend/seed/` (creación del usuario único).

## Manejo Global de Errores y Respuestas HTTP
- Todas las respuestas de error DEBEN seguir este formato exacto: `{ "error": "Mensaje describiendo el error" }`.
- **400 Bad Request**: 
  - Si el payload falla la validación (ej. falta el título del ticket, un campo tiene un tipo incorrecto o `priority` no es un valor permitido).
  - Si el body no es un JSON válido (JSON malformado).
  - Si un ID proporcionado (en la URL, en el body o en el header `X-User-Id`) no tiene el formato válido de 24 caracteres hexadecimales (ObjectId de MongoDB).
  - Si un recurso hijo existe pero no pertenece al padre solicitado (Aislamiento de Rutas).
- **401 Unauthorized**:
  - Si las credenciales del login son incorrectas.
  - Si un endpoint que requiere usuario no recibe el header `X-User-Id`, o el usuario indicado no existe.
- **404 Not Found**: 
  - Si un ID tiene formato de ObjectId válido pero no existe en la base de datos.
  - Si un recurso padre requerido (Board o Column) no existe (Parent Check).
- **201 Created**: Operaciones `POST` de creación exitosas.
- **200 OK**: Operaciones `GET`, `PATCH` y el login exitosos.
- **204 No Content**: Operaciones `DELETE` exitosas.
- **500 Internal Server Error**: Reservado EXCLUSIVAMENTE para fallas imprevistas. Los errores de validación y de casteo de Mongoose (`ValidationError`, `CastError`) deben traducirse a 400 en el middleware global de errores.

## Límites Negativos (Reglas Estrictas de "NO HACER")
- **NO** usar arrays simples para anidar tickets dentro de las columnas; debes usar referencias de Mongoose (`ObjectIds`).
- **NO** devolver un error genérico 500 (Internal Server Error) si un recurso padre (`boardId` o `columnId`) no existe. Debes interceptar esto y devolver un 404.
- **NO** usar `findByIdAndDelete` directamente si esto omite los middleware hooks de Mongoose. Debes asegurarte de que el borrado en cascada funcione (ej. disparando los hooks `pre('deleteOne')`).
- **NO** guardar contraseñas en texto plano ni devolverlas en ninguna respuesta (hash con `bcryptjs` y campo con `select: false`).
- **NO** exponer endpoints para crear usuarios: el único usuario se crea con el seed.
- **NO** hardcodear URLs, orígenes CORS ni credenciales: se leen de variables de entorno.
- **NO** generar la aplicación entera (modelos, controladores, rutas) en la respuesta a un solo prompt. Ver la sección "Implementación Paso a Paso" a continuación.

## Reglas de Negocio y Requisitos Técnicos
- **Verificación Estricta (Parent Check)**: Antes de crear un recurso hijo (ej. una Columna), DEBES consultar a la base de datos para verificar que el padre (`boardId`) existe. Si no existe, abortar y devolver 404. Aplica la misma regla para Tickets respecto a su `columnId`.
- **Aislamiento de Rutas (Middleware)**: Asegurar que un hijo realmente pertenece al padre especificado en la URL. Si una petición apunta a `/api/boards/123/columns/456/tickets`, debes validar que la columna `456` pertenece al tablero `123`.
- **Borrado en Cascada**: Eliminar un Tablero (Board) debe eliminar automáticamente todas sus Columnas y Tickets asociados. Eliminar una Columna debe eliminar sus Tickets. Implementar esto usando hooks de Mongoose (ej. `pre('deleteOne')`).
- **Idempotencia**: Los endpoints de actualización (como `PATCH` para mover un ticket) DEBEN ser idempotentes. Enviar la misma petición dos veces (debido a una falla de red) debe resultar en el mismo estado exacto en la base de datos sin duplicar datos o corromper el ordenamiento.
  - Solo se escriben en la base los campos que difieren del estado actual.
  - Si se reintenta un `PATCH` que ya movió el ticket (la URL todavía apunta a la columna de origen y `newColumnId` coincide con la columna actual del ticket), NO es un error de aislamiento: se responde 200 con el ticket sin modificarlo.
- **Prioridad de Tickets**: Todo ticket tiene `priority` con uno de estos valores: `low`, `medium` o `high` (por defecto `medium`). Se puede enviar al crear (`POST`) y al actualizar (`PATCH`); cualquier otro valor devuelve 400.
- **Usuario Único Simulado**: Existe un solo usuario en la colección `users` (nombre, email y contraseña hasheada), creado por el seed a partir de las variables `DEMO_USER_NAME`, `DEMO_USER_EMAIL` y `DEMO_USER_PASSWORD`. El seed es idempotente (nunca duplica el usuario), se ejecuta al arrancar el servidor y también con `npm run seed`, y asigna a ese usuario los tableros que no tengan dueño.
- **Usuario Actual (`X-User-Id`)**: El login devuelve el usuario con su `_id`. Los endpoints que lo requieren (ver tabla) reciben ese `_id` en el header `X-User-Id`, que un middleware valida (formato → 400; ausente o inexistente → 401) e inyecta en `req.user`. NO es autenticación real: no hay token ni contraseña en cada petición.
- **Dueño de los Tableros**: Cada Board referencia a su dueño (`owner` → User). `POST /api/boards` asigna como dueño al usuario actual y `GET /api/boards` devuelve solo sus tableros. El resto de los endpoints no verifica el dueño (con un único usuario no aporta; una autorización real requiere JWT).

## Especificación de Endpoints (Contrato de la API)
El sistema debe exponer exactamente la siguiente estructura de rutas. Todo ticket debe nacer estrictamente dentro del contexto de una columna y un tablero. El endpoint `DELETE /api/boards/:boardId` se agrega al contrato base para exponer el borrado en cascada de un tablero. Los endpoints de health, login, listado de tableros y borrado de tickets, el header `X-User-Id` y el campo `priority` se agregaron para dar soporte al frontend y al despliegue (ver `frontend/requerimientos.md`, §7.3).

| Método | Endpoint | Acción | Requiere `X-User-Id` | Código de Éxito |
|---|---|---|---|---|
| GET | `/api/health` | Estado del servicio (health check del despliegue). | No | 200 OK |
| POST | `/api/auth/login` | Valida `email` y `password` del usuario único y devuelve `{ _id, name, email }`. | No | 200 OK |
| GET | `/api/boards` | Lista los tableros del usuario actual (sin poblar, del más reciente al más antiguo). | Sí | 200 OK |
| POST | `/api/boards` | Crea un nuevo tablero cuyo dueño es el usuario actual. | Sí | 201 Created |
| GET | `/api/boards/:boardId` | Obtiene un tablero con sus columnas pobladas. | No | 200 OK |
| DELETE | `/api/boards/:boardId` | Elimina un tablero con sus columnas y tickets (cascada). | No | 204 No Content |
| POST | `/api/boards/:boardId/columns` | Agrega una columna a un tablero específico. | No | 201 Created |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Elimina una columna. | No | 204 No Content |
| POST | `/api/boards/:boardId/columns/:columnId/tickets` | Crea un ticket dentro de una columna específica (acepta `priority`). | No | 201 Created |
| PATCH | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Mueve un ticket o actualiza su contenido (incluida `priority`). | No | 200 OK |
| DELETE | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Elimina un ticket. | No | 204 No Content |

## Variables de Entorno y Despliegue
| Variable | Uso | Ejemplo local |
|---|---|---|
| `PORT` | Puerto del servidor (por defecto `3000`; en Render lo define la plataforma). | `3000` |
| `MONGO_URI` | Cadena de conexión a MongoDB (local o Atlas). | `mongodb://localhost:27017/kanban-itba` |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma. Si no se define, se permite cualquier origen (solo desarrollo). | `http://localhost:5173` |
| `DEMO_USER_NAME` / `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | Datos del usuario único que crea el seed. | `Demo` / `demo@kanban.com` / `demo1234` |

- **Despliegue:** backend en **Render** (Web Service definido en `render.yaml`, con `rootDir: backend` y health check en `/api/health`), base de datos en **MongoDB Atlas** y frontend en **Vercel**.

## Pruebas y Contratos
- La API está guiada por el contrato estricto de endpoints definido arriba. Prueba tu código usando Postman o ThunderClient.
- **Enfoque Test-First**: Siempre comenzar generando/actualizando el archivo `backend/thunder-collection.json` basado en el contrato de la API antes de escribir la lógica de negocio. Iterar sobre el código hasta que todos los endpoints pasen las pruebas.
- Cada request de las colecciones DEBE incluir asserts del código HTTP esperado y, en los casos de error, del formato `{ "error": string }`. Los IDs creados se guardan automáticamente en variables (`userId`, `boardId`, `columnId`, `newColumnId`, `ticketId`, ...) para que la colección se ejecute de punta a punta sin copiar y pegar.
- Las colecciones empiezan con el login del usuario único: guardan `userId` y lo envían en el header `X-User-Id` en las peticiones que lo requieren.
- `backend/postman_collection.json` debe mantenerse sincronizada con `backend/thunder-collection.json`.

## Implementación Paso a Paso (Partición Generativa)
Cada fase se pide en un prompt separado y se revisa y valida antes de avanzar a la siguiente:
1. **Fase 0 (Contrato)**: Generar `backend/thunder-collection.json` a partir de la tabla de endpoints y las reglas de error.
2. **Fase 1 (Datos)**: Generar solo los esquemas de Mongoose (`User`, `Board`, `Column`, `Ticket`) con sus referencias (`ref`) y los hooks `pre('deleteOne')` para el borrado en cascada.
3. **Fase 2 (Validación)**: Generar los middlewares de Parent Check y Aislamiento de Rutas (`checkBoard`, `checkColumn`, `checkTicket`), el del usuario actual y el middleware global de errores.
4. **Fase 3 (Controladores)**: Implementar los controladores de a un endpoint por vez, usando los modelos y middlewares ya generados.
5. **Fase 4 (Rutas)**: Conectar controladores y middlewares en routers anidados con `mergeParams: true`.
6. **Fase 5 (Verificación)**: Ejecutar la colección completa hasta que todas las peticiones pasen a verde.
