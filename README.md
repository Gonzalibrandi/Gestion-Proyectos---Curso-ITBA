# API Kanban - Gestión de Proyectos (Curso ITBA)

API RESTful para la gestión de proyectos al estilo Kanban. Implementa un diseño estricto de rutas anidadas que refleja la relación jerárquica **Padre → Hijo → Nieto**: `Tableros (Boards) → Columnas (Columns) → Tickets`.

## Tecnologías Utilizadas
- **Node.js** v24
- **Express** 4
- **MongoDB** + **Mongoose** 8
- **dotenv** y **cors**

## Requisitos Previos
- Node.js 20 o superior (desarrollado con v24.13.0)
- Una instancia de MongoDB: local (`mongodb://localhost:27017`) o un cluster de MongoDB Atlas

## Instalación y Configuración

1. Clonar el repositorio e instalar las dependencias:
   ```bash
   git clone https://github.com/Gonzalibrandi/Gestion-Proyectos---Curso-ITBA.git
   cd Gestion-Proyectos---Curso-ITBA
   npm install
   ```

2. Crear el archivo de variables de entorno a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```

   | Variable | Descripción | Ejemplo |
   |---|---|---|
   | `PORT` | Puerto del servidor (por defecto `3000`) | `3000` |
   | `MONGO_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/kanban-itba` |

3. Iniciar el servidor:
   - Desarrollo (con Nodemon): `npm run dev`
   - Producción: `npm start`

## Estructura del Proyecto
Cada capa vive en su propio módulo (Principio de Responsabilidad Única). Los archivos de rutas no tienen consultas a la base de datos ni lógica de negocio.

```
├── server.js                  # Configuración de Express, conexión a MongoDB y arranque
├── models/                    # Esquemas de Mongoose y hooks de borrado en cascada
│   ├── Board.js
│   ├── Column.js              # ref -> Board
│   └── Ticket.js              # ref -> Column y Board
├── controllers/               # Lógica de negocio de cada recurso
│   ├── boardController.js
│   ├── columnController.js
│   └── ticketController.js
├── routes/                    # Routers anidados (mergeParams)
│   ├── boardRoutes.js         # /api/boards
│   ├── columnRoutes.js        # /api/boards/:boardId/columns
│   └── ticketRoutes.js        # /api/boards/:boardId/columns/:columnId/tickets
├── middlewares/
│   ├── parentCheck.js         # Parent Check + Aislamiento de Rutas
│   └── errorHandler.js        # 404 de rutas inexistentes y manejo global de errores
├── utils/
│   └── validation.js          # Validación de ObjectId y de campos de texto
├── thunder-collection.json    # Colección de pruebas para Thunder Client
├── postman_collection.json    # Colección de pruebas para Postman
└── AGENTS.md                  # Especificación del proyecto para agentes de IA (SDD)
```

## Especificación de Endpoints

| Método | Endpoint | Acción | Éxito |
|---|---|---|---|
| POST | `/api/boards` | Crea un nuevo tablero. | 201 |
| GET | `/api/boards/:boardId` | Obtiene un tablero con sus columnas (y los tickets de cada una) pobladas. | 200 |
| DELETE | `/api/boards/:boardId` | Elimina un tablero junto con sus columnas y tickets (cascada). | 204 |
| POST | `/api/boards/:boardId/columns` | Agrega una columna a un tablero. | 201 |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Elimina una columna junto con sus tickets (cascada). | 204 |
| POST | `/api/boards/:boardId/columns/:columnId/tickets` | Crea un ticket dentro de una columna. | 201 |
| PATCH | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Actualiza el contenido de un ticket y/o lo mueve de columna (idempotente). | 200 |

> No existen rutas planas (ej. `/api/tickets`): todo ticket nace dentro del contexto de una columna y un tablero.

### Cuerpos de las peticiones

| Endpoint | Body | Campos obligatorios |
|---|---|---|
| `POST /api/boards` | `{ "name": "Proyecto Alpha", "description": "Opcional" }` | `name` |
| `POST .../columns` | `{ "name": "To Do" }` | `name` |
| `POST .../tickets` | `{ "title": "Implementar Auth", "description": "Opcional" }` | `title` |
| `PATCH .../tickets/:ticketId` | `{ "title": "...", "description": "...", "newColumnId": "<id de columna destino>" }` | Ninguno (se aplican solo los campos enviados) |

### Ejemplo de respuesta: `GET /api/boards/:boardId`

```json
{
  "_id": "6ad184755d9f85d901bbb60c",
  "name": "Proyecto Alpha",
  "description": "Tablero principal del proyecto",
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
          "column": "6ad184755d9f85d901bbb614",
          "board": "6ad184755d9f85d901bbb60c"
        }
      ]
    }
  ]
}
```

## Manejo de Errores

Todas las respuestas de error respetan el formato: `{ "error": "Mensaje describiendo el error" }`.

| Código | Cuándo ocurre | Ejemplo |
|---|---|---|
| 400 | El payload falla la validación (campo obligatorio faltante, vacío o con tipo incorrecto). | `POST .../tickets` sin `title` |
| 400 | El body no es un JSON válido. | `{ "name": ` |
| 400 | Un ID no tiene el formato de ObjectId (24 caracteres hexadecimales). | `GET /api/boards/123` |
| 400 | Aislamiento de Rutas: el recurso existe pero no pertenece al padre de la URL. | Una columna del tablero B pedida desde el tablero A |
| 404 | El ID tiene formato válido pero no existe en la base de datos. | `GET /api/boards/000000000000000000000000` |
| 404 | Parent Check: el tablero o la columna padre no existe. | `POST /api/boards/<id inexistente>/columns` |
| 404 | La ruta no existe. | `POST /api/tickets` |
| 500 | Solo ante fallas imprevistas del servidor. | — |

## Reglas de Negocio
- **Parent Check:** antes de operar sobre un hijo, los middlewares (`checkBoard`, `checkColumn`, `checkTicket`) consultan la base de datos para verificar que el padre existe. Si no existe, se aborta con 404 (nunca un 500).
- **Aislamiento de Rutas:** se valida que la columna pertenezca al tablero de la URL y que el ticket pertenezca a ese tablero y a esa columna. Tampoco se puede mover un ticket a una columna de otro tablero.
- **Borrado en Cascada:** se implementa con hooks `pre('deleteOne')` de Mongoose. Eliminar un tablero elimina sus columnas y tickets, y eliminar una columna elimina sus tickets. Los controladores usan `documento.deleteOne()` para que los hooks se disparen.
- **Referencias, no arrays:** las relaciones se modelan con referencias (`ObjectId` + `ref`), y las columnas y tickets se obtienen con *virtual populate*.
- **Idempotencia del PATCH:** solo se escriben en la base los campos que realmente cambian. Si se reintenta un `PATCH` que ya movió el ticket (por ejemplo, por una falla de red), la API responde `200` con el mismo ticket, sin duplicar datos ni modificar nada.

## Pruebas (Collections)
El proyecto incluye dos colecciones equivalentes, con **27 peticiones y asserts automáticos** (código HTTP esperado y formato `{ error }`), organizadas en tres carpetas:

1. **Flujo principal:** crear tablero, columnas y ticket, obtener el tablero poblado, actualizar, mover y reintentar el movimiento (idempotencia).
2. **Validaciones y errores:** casos 400 (payload inválido, JSON malformado, ID inválido, aislamiento) y 404 (Parent Check, recurso inexistente).
3. **Borrado en cascada:** eliminar una columna o un tablero y verificar que sus hijos también se eliminaron.

Los IDs que se crean se guardan automáticamente en variables (`boardId`, `columnId`, `newColumnId`, `ticketId`, `otherBoardId`, `otherColumnId`), así que **la colección se ejecuta completa y en orden** sin copiar y pegar nada.

- **Postman:** importar `postman_collection.json` y ejecutar *Run collection*. Las variables viven en la colección (`baseUrl` = `http://localhost:3000`).
- **Thunder Client:** importar `thunder-collection.json`, activar un entorno (por ejemplo, uno vacío llamado `Kanban Local`) para que se guarden los IDs y ejecutar *Run All*.
