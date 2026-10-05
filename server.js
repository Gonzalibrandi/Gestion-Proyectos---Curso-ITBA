require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importar el enrutador principal de Tableros
const boardRoutes = require('./routes/boardRoutes');

const app = express();

// Middlewares Globales
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Parsea payloads JSON en el req.body

// Montar Rutas
// Todas las rutas anidadas inician a partir de /api/boards
app.use('/api/boards', boardRoutes);

// Manejo de Rutas Inexistentes (404 Global)
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejo Global de Errores imprevistos (500)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
});

// Conexión a Base de Datos y arranque del servidor
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conectado exitosamente a MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        process.exit(1); // Detiene la aplicación si no hay base de datos
    });
