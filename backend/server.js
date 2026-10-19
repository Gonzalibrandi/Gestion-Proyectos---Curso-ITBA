require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importar los enrutadores
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { seedDemoUser } = require('./seed/seedDemoUser');

const app = express();

// CORS: en producción solo se aceptan los orígenes de CORS_ORIGIN (separados por coma).
// Si no se define, se permite cualquier origen (solo para desarrollo).
const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : '*';

// Middlewares Globales
app.use(cors({ origin: corsOrigin })); // Permite peticiones desde el frontend
app.use(express.json()); // Parsea payloads JSON en el req.body

// Montar Rutas
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
// Todas las rutas anidadas inician a partir de /api/boards
app.use('/api/boards', boardRoutes);

// Manejo de Rutas Inexistentes (404 Global)
app.use(notFound);

// Manejo Global de Errores (JSON malformado y validaciones -> 400, imprevistos -> 500)
app.use(errorHandler);

// Conexión a Base de Datos, seed del usuario único y arranque del servidor
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Conectado exitosamente a MongoDB');
        await seedDemoUser(); // Idempotente: solo crea el usuario si no existe
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1); // Detiene la aplicación si no hay base de datos
    });
