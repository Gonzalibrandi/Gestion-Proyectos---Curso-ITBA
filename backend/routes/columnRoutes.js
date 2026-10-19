const express = require('express');
const router = express.Router({ mergeParams: true });
const columnController = require('../controllers/columnController');
const ticketRoutes = require('./ticketRoutes');
const { checkBoard, checkColumn } = require('../middlewares/parentCheck');

// POST /api/boards/:boardId/columns
router.post('/', checkBoard, columnController.createColumn);

// DELETE /api/boards/:boardId/columns/:columnId
router.delete('/:columnId', checkBoard, checkColumn, columnController.deleteColumn);

// Anidamos las rutas de tickets dentro de las columnas
// Esto ataja todas las peticiones a /api/boards/:boardId/columns/:columnId/tickets
router.use('/:columnId/tickets', ticketRoutes);

module.exports = router;
