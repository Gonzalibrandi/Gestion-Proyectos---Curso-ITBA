# API Kanban - Gestión de Proyectos (Curso ITBA)

API RESTful completa para la gestión de proyectos al estilo Kanban. Implementa un diseño estricto de rutas anidadas reflejando la relación jerárquica: `Tableros -> Columnas -> Tickets`.

## Tecnologías Utilizadas
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **dotenv** & **cors**

## Instalación y Configuración

1. Clonar el repositorio e instalar las dependencias:
   ```bash
   npm install
   ```

2. Crear tu archivo de variables de entorno:
   Copia el archivo `.env.example` y renómbralo a `.env`. Completa tu `MONGO_URI` con tus credenciales de MongoDB (Local o Atlas).

3. Iniciar el servidor:
   - Para desarrollo (con Nodemon): `npm run dev`
   - Para producción: `npm start`

## Pruebas (Collections)
El proyecto incluye colecciones listas para importar y testear todos los endpoints automáticamente:
- Si usas **Thunder Client**, importa `thunder-collection.json`.
- Si usas **Postman**, importa `postman_collection.json`.

*Nota: Las peticiones están configuradas con variables de entorno (ej. `{{boardId}}`) para facilitar las pruebas sin copiar y pegar IDs.*

## Especificación de Endpoints

Todas las respuestas de error respetan el formato estricto: `{ "error": "mensaje" }`.

| Método | Endpoint | Acción | HTTP |
|---|---|---|---|
| POST | `/api/boards` | Crea un nuevo tablero. | 201 |
| GET | `/api/boards/:boardId` | Obtiene un tablero con columnas pobladas. | 200 |
| POST | `/api/boards/:boardId/columns` | Agrega una columna a un tablero. | 201 |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Elimina una columna en cascada. | 204 |
| POST | `/api/boards/:boardId/columns/:columnId/tickets` | Crea un ticket en la columna. | 201 |
| PATCH | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Actualiza o mueve un ticket de forma idempotente. | 200 |