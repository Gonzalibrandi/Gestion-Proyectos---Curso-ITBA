const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const columnRoutes = require('./columnRoutes');
const { checkBoard } = require('../middlewares/parentCheck');

// POST /api/boards
router.post('/', boardController.createBoard);

// GET /api/boards/:boardId
router.get('/:boardId', checkBoard, boardController.getBoard);

// Anidamos las rutas de columnas dentro de los tableros
// Esto ataja todas las peticiones a /api/boards/:boardId/columns
router.use('/:boardId/columns', columnRoutes);

module.exports = router;
