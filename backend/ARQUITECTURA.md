# Arquitectura del Backend

Este documento explica **cómo está construida la API y por qué**: las decisiones de arquitectura, los frameworks y librerías elegidos, y los límites conocidos de la solución. Las instrucciones de instalación y la especificación de endpoints están en el [`README.md`](../README.md) de la raíz.

## 1. Visión General

API REST en Node.js que modela la jerarquía **Tablero → Columna → Ticket** con rutas anidadas, más un **usuario único simulado** que es dueño de los tableros. Cada petición atraviesa siempre las mismas capas, y cada capa tiene una única responsabilidad:

```
Petición HTTP
   │
   ▼
cors() + express.json()  ──(JSON malformado)─────────────────────┐
   │                                                             │
   ▼                                                             │
Routers  /api/health · /api/auth · /api/boards → /:boardId/columns → /:columnId/tickets
   │                                                             │
   ▼                                                             │
Middlewares  requireUser (X-User-Id) · parentCheck (formato de ID → existencia → pertenencia)
   │        └─ responde 400 / 401 / 404 y corta la cadena        │
   ▼                                                             │
Controlador  (validación del payload + lógica de negocio)        │
   │                                                             │
   ▼                                                             │
Modelo Mongoose  (esquema, validación, hooks de cascada y hash)  │
   │                                                             │
   ▼                                                             ▼
Respuesta 2xx                         errorHandler  →  400 / 500 { "error": "..." }
```

## 2. Stack Tecnológico y Motivos

| Tecnología | Versión | Por qué |
|---|---|---|
| **Node.js** | v24.13.0 (`engines: 24.x`) | Es la versión instalada en el entorno de desarrollo. Trae `fetch` y `node:test` nativos y soporte LTS. Fijarla en `engines` hace que Render use la misma versión. |
| **Express** | 4.x (`^4.21.0`) | Es el framework minimalista más difundido para APIs en Node: router modular, middlewares encadenables y mucha documentación. Se eligió la rama 4 por ser la más estable y la usada en el curso. **Consecuencia:** Express 4 no captura errores de funciones `async`, así que cada controlador usa `try/catch` y `next(error)`. |
| **MongoDB** | — | Base documental flexible. Encaja con un modelo de pocas entidades y relaciones jerárquicas simples. |
| **Mongoose** | 8.x (`^8.7.0`) | Agrega esquemas con validación (incluido `enum`), referencias entre colecciones (`ref` + `populate`) y **middlewares (hooks)**, que son la base del borrado en cascada y del hash de la contraseña. |
| **bcryptjs** | 3.x | Hash de la contraseña del usuario. Se eligió `bcryptjs` (JavaScript puro) en lugar de `bcrypt` (nativo) para evitar compilaciones nativas en Windows y en Render. |
| **dotenv** | 16.x | Saca la configuración (`PORT`, `MONGO_URI`, `CORS_ORIGIN`, `DEMO_USER_*`) del código, siguiendo el principio de los 12 factores. `.env` no se versiona; `.env.example` documenta las variables. |
| **cors** | 2.x | Habilita peticiones desde otro origen (el frontend en Vite o en Vercel), limitado a los orígenes de `CORS_ORIGIN`. |
| **nodemon** | 3.x (dev) | Reinicia el servidor automáticamente al guardar cambios durante el desarrollo. |

**Alternativas descartadas:**
- **Express 5:** maneja solo los errores `async`, pero es una versión mayor más reciente. Se priorizó la estabilidad.
- **NestJS:** agrega mucha estructura y abstracciones para una API de una decena de endpoints.
- **Joi o Zod para validar:** pocos campos no justifican una dependencia más (ver §6).
- **Passport / JWT:** la autenticación completa no es obligatoria en esta etapa (ver §9).

## 3. Arquitectura en Capas (Principio de Responsabilidad Única)

| Carpeta / Archivo | Responsabilidad | Lo que NO hace |
|---|---|---|
| `server.js` | Arma la app: CORS, middlewares globales, monta las rutas, conecta a MongoDB, ejecuta el seed y arranca el servidor. | No tiene lógica de negocio. |
| `routes/` | Declara las URLs y encadena middlewares y controladores. | No consulta la base ni decide respuestas. |
| `middlewares/parentCheck.js` | Parent Check y Aislamiento de Rutas. | No crea ni modifica datos. |
| `middlewares/currentUser.js` | Identifica al usuario actual a partir del header `X-User-Id` (`requireUser`). | No autentica: no verifica contraseñas ni tokens. |
| `middlewares/errorHandler.js` | 404 de rutas inexistentes y traducción centralizada de errores. | No conoce la lógica de cada recurso. |
| `controllers/` | Valida el payload, ejecuta la operación y elige el código HTTP. | No define rutas. |
| `models/` | Esquemas, referencias, virtuals, hooks de cascada y hash de la contraseña. | No conoce HTTP. |
| `utils/validation.js` | Validaciones puras y reutilizables (`isValidObjectId`, `isNonEmptyString`, `isValidPriority`) y la lista `TICKET_PRIORITIES`. | No tiene efectos secundarios. |
| `seed/` | Crea el usuario único (`seedDemoUser.js`) y lo ejecuta de forma manual (`run.js`). | No se expone como endpoint. |

Así cada regla vive en un solo lugar. Por ejemplo, los valores permitidos de `priority` están definidos una única vez, en `utils/validation.js`, y los usan tanto el modelo como los controladores.

## 4. Modelo de Datos

```
User (1) ───< Board (N) ───< Column (N) ───< Ticket (N)
                 ▲                              │
                 └──────── ticket.board ────────┘  (referencia redundante, intencional)
```

| Modelo | Campos | Referencias |
|---|---|---|
| `User` | `name`, `email` (único, en minúsculas), `password` (hash, `select: false`), timestamps | — |
| `Board` | `name` (requerido), `description`, `owner` (requerido), timestamps | `owner → User`, virtual `columns` |
| `Column` | `name` (requerido), `board`, timestamps | `board → Board`, virtual `tickets` |
| `Ticket` | `title` (requerido), `description`, `priority` (`low` / `medium` / `high`, por defecto `medium`), `column`, `board`, timestamps | `column → Column`, `board → Board` |

### Decisiones
- **Referencias (`ObjectId` + `ref`) en lugar de arrays embebidos.** Una columna puede acumular tickets sin límite, y un documento de MongoDB no puede superar los 16 MB. Además, con arrays, mover un ticket obligaría a sacarlo de un array y meterlo en otro, en dos escrituras que pueden quedar inconsistentes. Con referencias, mover un ticket es **cambiar un solo campo** (`ticket.column`).
- **Los hijos apuntan al padre (y no al revés).** El padre no guarda una lista de IDs que haya que mantener sincronizada. Las columnas y tickets de un tablero se obtienen con **virtual populate** (`localField: '_id'`, `foreignField: 'board'`), que se resuelve en el momento de la consulta.
- **`Ticket.board` redundante.** Un ticket podría llegar a su tablero a través de su columna, pero guardar `board` directamente permite:
  1. Borrar todos los tickets de un tablero con un solo `deleteMany({ board })` en la cascada.
  2. Validar el aislamiento del ticket respecto del tablero sin una consulta extra.
  3. Comprobar en el `PATCH` que la columna destino pertenece al mismo tablero.
- **`Ticket.priority` con valores en inglés.** Mantiene la coherencia con los nombres de campo de la API (`title`, `description`); la UI los traduce (Baja, Media, Alta). Se valida en dos niveles: el controlador responde 400 con un mensaje claro, y el `enum` del esquema actúa como red de seguridad. Los tickets creados antes de existir el campo reciben `medium` al leerse, porque Mongoose aplica el valor por defecto al cargar el documento.
- **`Board.owner` requerido.** Todo tablero tiene dueño. Los tableros creados antes de existir los usuarios se migran con el seed (ver §9).

## 5. Rutas

Los routers de tableros se montan uno dentro del otro con `express.Router({ mergeParams: true })`, para que `ticketRoutes` tenga acceso a `:boardId` y `:columnId`:

```
healthRoutes  /api/health
authRoutes    /api/auth/login
boardRoutes   /api/boards
 └─ columnRoutes   /:boardId/columns
     └─ ticketRoutes   /:columnId/tickets
```

No existen rutas planas (`/api/tickets`): un ticket solo se puede crear dentro del contexto de una columna y un tablero, como exige el contrato.

## 6. Validación en Cuatro Niveles

| Nivel | Dónde | Qué valida | Respuesta |
|---|---|---|---|
| 1. Sintaxis | `express.json()` + `errorHandler` | Que el body sea un JSON válido. | 400 |
| 2. Usuario actual | `requireUser` | Que llegue `X-User-Id`, con formato de ObjectId, y que el usuario exista. | 400 / 401 |
| 3. Parámetros de la URL | `parentCheck` | Formato de ObjectId (24 caracteres hexadecimales), existencia y pertenencia. | 400 / 404 |
| 4. Payload | Controladores (`utils/validation.js`) | Campos obligatorios, no vacíos, del tipo correcto y `priority` permitida. | 400 |
| Red de seguridad | Esquemas de Mongoose + `errorHandler` | `ValidationError` y `CastError` que se hayan escapado. | 400 |

Se valida "a mano" con funciones puras porque hay muy pocos campos (`name`, `title`, `description`, `priority`, `newColumnId`, `email`, `password`). Los mensajes quedan en español y controlados, sin depender de una librería.

## 7. Parent Check y Aislamiento de Rutas

Los middlewares `checkBoard`, `checkColumn` y `checkTicket` se encadenan en cada ruta y aplican siempre el mismo orden:

1. **Formato:** ¿es un ObjectId válido? Si no, **400**.
2. **Existencia:** ¿existe en la base? Si no, **404**. Esto evita el 500 genérico de Mongoose.
3. **Pertenencia:** ¿pertenece al padre de la URL? Si no, **400** (Aislamiento). Un ticket debe pertenecer al tablero **y** a la columna de la URL, también para borrarlo.

El documento encontrado se guarda en `req.board`, `req.column` o `req.ticket`. Así el controlador no vuelve a consultarlo; por ejemplo, `deleteTicket` usa `req.ticket.deleteOne()` directamente.

## 8. Borrado en Cascada

Se implementa con **hooks de Mongoose**, no en los controladores, para que la regla se cumpla sin importar quién borre:

| Se borra | Hook | Efecto |
|---|---|---|
| Tablero | `boardSchema.pre('deleteOne', { document: true })` | Borra sus columnas y tickets. |
| Columna | `columnSchema.pre('deleteOne', { document: true })` | Borra sus tickets. |
| Ticket | — | No tiene hijos. |

- Los controladores usan **`documento.deleteOne()`**, que dispara los hooks de documento. `findByIdAndDelete` no los dispara.
- Como red de seguridad, también hay hooks `pre('findOneAndDelete')`, por si en el futuro alguien usa `findByIdAndDelete`.

## 9. Usuario Único Simulado

La consigna del frontend pide login y "tableros del usuario", pero la autenticación completa no es obligatoria en esta etapa. Se resolvió con un usuario real en la base, sin tokens:

| Pieza | Decisión | Por qué |
|---|---|---|
| **Colección `users`** | Un **único** documento (`name`, `email`, `password`). No hay endpoint para crear usuarios. | El login es verificable contra la base sin construir registro ni gestión de usuarios. |
| **Contraseña** | Se hashea con `bcryptjs` en un hook `pre('save')`. El campo tiene `select: false` y se elimina al serializar (`toJSON`). | Nunca se guarda ni se devuelve en texto plano. |
| **Seed idempotente** | `seedDemoUser()` crea el usuario a partir de `DEMO_USER_*` **solo si no existe ninguno**, y asigna a ese usuario los tableros sin `owner`. Se ejecuta al arrancar el servidor y con `npm run seed`. | Al desplegar, la base de Atlas queda lista sin depender de una consola en el servidor. Que sea idempotente permite ejecutarlo en cada arranque sin duplicar datos. |
| **Login** | `POST /api/auth/login` compara la contraseña con `bcrypt.compare` y devuelve `{ _id, name, email }`. Ante un email inexistente o una contraseña incorrecta responde el **mismo** 401. | No revelar cuál de los dos datos falló. |
| **Usuario actual** | El frontend envía el `_id` en el header `X-User-Id`. `requireUser` lo valida (ausente → 401, formato inválido → 400, inexistente → 401) y lo inyecta en `req.user`. | Es la forma más simple de saber "quién pide" sin tokens. |
| **Dueño de los tableros** | `POST /api/boards` asigna `owner = req.user` y `GET /api/boards` filtra por él (más reciente primero). El resto de los endpoints no verifica el dueño. | Cumple "lista de tableros del usuario" con un cambio mínimo. Verificar el dueño en cada endpoint no aporta nada con un único usuario. |

**Limitación:** no es seguridad real. Cualquiera que conozca el `_id` del usuario puede usar la API. La evolución natural es que el login devuelva un **JWT** firmado y que `requireUser` valide `Authorization: Bearer <token>` en lugar del header.

## 10. Manejo de Errores Centralizado

Todos los errores responden con el mismo formato, `{ "error": "mensaje" }`, para que el cliente los procese de una sola manera.

| Origen | Código |
|---|---|
| JSON malformado (`entity.parse.failed`) | 400 |
| `mongoose.Error.ValidationError` / `CastError` | 400 |
| Validaciones de los controladores y middlewares | 400 / 404 |
| Credenciales incorrectas o usuario actual ausente o inexistente | 401 |
| Ruta inexistente (`notFound`) | 404 |
| Cualquier otro error | 500 (se registra con `console.error`) |

Los controladores no deciden cuándo responder 500: delegan con `next(error)`, y `errorHandler` es el único lugar que lo hace.

## 11. Idempotencia del `PATCH`

`PATCH /api/boards/:boardId/columns/:columnId/tickets/:ticketId` está pensado para soportar reintentos (por ejemplo, ante una falla de red):
- **Escritura por diferencia:** solo se modifican los campos que difieren del estado actual (`title`, `description`, `priority`, `column`). Si no cambió nada, no se escribe en la base y `updatedAt` queda igual.
- **Movimiento reintentado:** después del primer `PATCH`, el ticket ya no pertenece a la columna de la URL. `checkTicket` lo detecta: si `newColumnId` coincide con la columna actual del ticket, lo trata como un reintento y responde `200` en lugar de un `400` de aislamiento.
- **Sin duplicados:** mover un ticket solo actualiza `ticket.column`, así que no hay arrays que puedan duplicar referencias.

## 12. Despliegue

| Pieza | Decisión | Por qué |
|---|---|---|
| **Plataforma** | **Render**, como Web Service definido en `render.yaml` (en la raíz del monorepo), con `rootDir: backend`, `npm ci` y `npm start`. | Render corre el servidor Express tal como está, sin adaptarlo a funciones serverless. Con `render.yaml`, la configuración queda versionada y es reproducible. |
| **Base de datos** | **MongoDB Atlas** (plan gratuito M0). | MongoDB administrado, accesible desde Render por `MONGO_URI`. |
| **Health check** | `GET /api/health` responde `200 { "status": "ok" }`, y Render lo usa en `healthCheckPath`. | Render solo da por sano el servicio si responde. Como el servidor empieza a escuchar recién después de conectarse a MongoDB, responder implica que la conexión inicial funcionó. |
| **Secretos** | En `render.yaml` las variables se declaran con `sync: false`, así que Render pide los valores al crear el servicio. | Ningún secreto queda en el repositorio. |
| **CORS** | `CORS_ORIGIN` con la lista de orígenes permitidos, separados por coma (por ejemplo, la URL de Vercel). Si no se define, se permite cualquiera (solo desarrollo). | En producción, solo el frontend desplegado puede llamar a la API desde el navegador. |
| **Puerto** | `process.env.PORT`, con `3000` por defecto. | Render asigna el puerto en tiempo de ejecución. |

**Arranque en frío:** el plan gratuito de Render suspende el servicio tras 15 minutos sin uso, y la primera petición posterior puede tardar ~50 s. El frontend lo contempla con sus estados de carga.

## 13. Pruebas (Contrato Primero)

- Las colecciones `thunder-collection.json` y `postman_collection.json` son el **contrato ejecutable** de la API. Tienen 42 peticiones y 77 asserts, en 4 carpetas: health y login, flujo principal, validaciones y errores, y cascada.
- La colección empieza con el login del usuario único: guarda `userId` y lo envía en `X-User-Id`. Los IDs creados se guardan automáticamente en variables, así que la colección se ejecuta de principio a fin sin intervención manual.
- La colección de Postman puede correrse desde la terminal con `newman`:
  ```bash
  npx newman run postman_collection.json
  ```

## 14. Limitaciones Conocidas y Próximos Pasos

| Limitación | Motivo | Posible evolución |
|---|---|---|
| La sesión es simulada (sin token) | La autenticación completa no es obligatoria en esta etapa. | JWT firmado en el login y validado en `requireUser`. |
| Un solo usuario | Alcance de la consigna. | Registro de usuarios y verificación del dueño en todos los endpoints. |
| Sin orden de tickets dentro de una columna | El contrato no lo pide. | Campo `position` con reordenamiento idempotente. |
| Sin paginación | Volumen de datos acotado. | `limit` / `cursor` en los listados. |
| Sin `PATCH` de tableros ni de columnas | El contrato no los incluye. | Agregarlos siguiendo la misma regla de escritura por diferencia. |
