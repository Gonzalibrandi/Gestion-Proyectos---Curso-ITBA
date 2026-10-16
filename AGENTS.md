# AGENTS.md

## Resumen del Proyecto
Esta es una API de Gestión de Proyectos estilo Kanban. Implementa un CRUD RESTful completo utilizando rutas anidadas que reflejan estrictamente la relación jerárquica entre Tableros (Boards), Columnas (Columns) y Tickets (Padre-Hijo-Nieto).

## Stack Tecnológico
- **Node.js**: v24.13.0
- **Framework**: Express 4.x (`^4.21.0`). Al ser Express 4, los errores de funciones `async` NO se propagan solos: cada controlador debe capturarlos con `try/catch` y llamar a `next(error)`.
- **Base de Datos / ORM**: MongoDB con Mongoose 8.x (`^8.7.0`)
- **Utilidades**: `dotenv` (variables de entorno) y `cors`.

## Convenciones y Patrones Arquitectónicos
- **Principio de Responsabilidad Única (SRP)**: Separar estrictamente las responsabilidades. Mantener Modelos, Controladores y Rutas en sus propios módulos aislados.
- **Sin lógica de BD en las Rutas**: Nunca colocar consultas a la base de datos o lógica de negocio dentro de los archivos de definición de rutas.
- **Diseño RESTful**: Usar rutas anidadas (ej. `/api/boards/:boardId/columns/:columnId/tickets`). NO usar rutas planas (ej. `/api/tickets`) para crear elementos.
- **Estructura de carpetas**: `models/` (esquemas), `controllers/` (lógica de negocio), `routes/` (solo definición de rutas y encadenado de middlewares), `middlewares/` (Parent Check, Aislamiento y manejo global de errores), `utils/` (validaciones reutilizables).

## Manejo Global de Errores y Respuestas HTTP
- Todas las respuestas de error DEBEN seguir este formato exacto: `{ "error": "Mensaje describiendo el error" }`.
- **400 Bad Request**: 
  - Si el payload falla la validación (ej. falta el título del ticket, o un campo tiene un tipo incorrecto).
  - Si el body no es un JSON válido (JSON malformado).
  - Si un ID proporcionado no tiene el formato válido de 24 caracteres hexadecimales (ObjectId de MongoDB).
  - Si un recurso hijo existe pero no pertenece al padre solicitado (Aislamiento de Rutas).
- **404 Not Found**: 
  - Si un ID tiene formato de ObjectId válido pero no existe en la base de datos.
  - Si un recurso padre requerido (Board o Column) no existe (Parent Check).
- **201 Created**: Operaciones `POST` exitosas.
- **200 OK**: Operaciones `GET` o `PATCH` exitosas.
- **204 No Content**: Operaciones `DELETE` exitosas.
- **500 Internal Server Error**: Reservado EXCLUSIVAMENTE para fallas imprevistas. Los errores de validación y de casteo de Mongoose (`ValidationError`, `CastError`) deben traducirse a 400 en el middleware global de errores.

## Límites Negativos (Reglas Estrictas de "NO HACER")
- **NO** usar arrays simples para anidar tickets dentro de las columnas; debes usar referencias de Mongoose (`ObjectIds`).
- **NO** devolver un error genérico 500 (Internal Server Error) si un recurso padre (`boardId` o `columnId`) no existe. Debes interceptar esto y devolver un 404.
- **NO** usar `findByIdAndDelete` directamente si esto omite los middleware hooks de Mongoose. Debes asegurarte de que el borrado en cascada funcione (ej. disparando los hooks `pre('deleteOne')`).
- **NO** generar la aplicación entera (modelos, controladores, rutas) en la respuesta a un solo prompt. Ver la sección "Implementación Paso a Paso" a continuación.

## Reglas de Negocio y Requisitos Técnicos
- **Verificación Estricta (Parent Check)**: Antes de crear un recurso hijo (ej. una Columna), DEBES consultar a la base de datos para verificar que el padre (`boardId`) existe. Si no existe, abortar y devolver 404. Aplica la misma regla para Tickets respecto a su `columnId`.
- **Aislamiento de Rutas (Middleware)**: Asegurar que un hijo realmente pertenece al padre especificado en la URL. Si una petición apunta a `/api/boards/123/columns/456/tickets`, debes validar que la columna `456` pertenece al tablero `123`.
- **Borrado en Cascada**: Eliminar un Tablero (Board) debe eliminar automáticamente todas sus Columnas y Tickets asociados. Eliminar una Columna debe eliminar sus Tickets. Implementar esto usando hooks de Mongoose (ej. `pre('deleteOne')`).
- **Idempotencia**: Los endpoints de actualización (como `PATCH` para mover un ticket) DEBEN ser idempotentes. Enviar la misma petición dos veces (debido a una falla de red) debe resultar en el mismo estado exacto en la base de datos sin duplicar datos o corromper el ordenamiento.
  - Solo se escriben en la base los campos que difieren del estado actual.
  - Si se reintenta un `PATCH` que ya movió el ticket (la URL todavía apunta a la columna de origen y `newColumnId` coincide con la columna actual del ticket), NO es un error de aislamiento: se responde 200 con el ticket sin modificarlo.

## Especificación de Endpoints (Contrato de la API)
El sistema debe exponer exactamente la siguiente estructura de rutas. Todo ticket debe nacer estrictamente dentro del contexto de una columna y un tablero. El endpoint `DELETE /api/boards/:boardId` se agrega al contrato base para exponer el borrado en cascada de un tablero.

| Método | Endpoint | Acción | Código de Éxito |
|---|---|---|---|
| POST | `/api/boards` | Crea un nuevo tablero. | 201 Created |
| GET | `/api/boards/:boardId` | Obtiene un tablero con sus columnas pobladas. | 200 OK |
| DELETE | `/api/boards/:boardId` | Elimina un tablero con sus columnas y tickets (cascada). | 204 No Content |
| POST | `/api/boards/:boardId/columns` | Agrega una columna a un tablero específico. | 201 Created |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Elimina una columna. | 204 No Content |
| POST | `/api/boards/:boardId/columns/:columnId/tickets` | Crea un ticket dentro de una columna específica. | 201 Created |
| PATCH | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Mueve un ticket o actualiza su contenido. | 200 OK |

## Pruebas y Contratos
- La API está guiada por el contrato estricto de endpoints definido arriba. Prueba tu código usando Postman o ThunderClient.
- **Enfoque Test-First**: Siempre comenzar generando/actualizando el archivo `thunder-collection.json` basado en el contrato de la API antes de escribir la lógica de negocio. Iterar sobre el código hasta que todos los endpoints pasen las pruebas.
- Cada request de las colecciones DEBE incluir asserts del código HTTP esperado y, en los casos de error, del formato `{ "error": string }`. Los IDs creados se guardan automáticamente en variables (`boardId`, `columnId`, `newColumnId`, `ticketId`, ...) para que la colección se ejecute de punta a punta sin copiar y pegar.
- `postman_collection.json` debe mantenerse sincronizada con `thunder-collection.json`.

## Implementación Paso a Paso (Partición Generativa)
Cada fase se pide en un prompt separado y se revisa y valida antes de avanzar a la siguiente:
1. **Fase 0 (Contrato)**: Generar `thunder-collection.json` a partir de la tabla de endpoints y las reglas de error.
2. **Fase 1 (Datos)**: Generar solo los esquemas de Mongoose (`Board`, `Column`, `Ticket`) con sus referencias (`ref`) y los hooks `pre('deleteOne')` para el borrado en cascada.
3. **Fase 2 (Validación)**: Generar los middlewares de Parent Check y Aislamiento de Rutas (`checkBoard`, `checkColumn`, `checkTicket`) y el middleware global de errores.
4. **Fase 3 (Controladores)**: Implementar los controladores de a un endpoint por vez, usando los modelos y middlewares ya generados.
5. **Fase 4 (Rutas)**: Conectar controladores y middlewares en routers anidados con `mergeParams: true`.
6. **Fase 5 (Verificación)**: Ejecutar la colección completa hasta que todas las peticiones pasen a verde.
