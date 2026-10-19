const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const columnRoutes = require('./columnRoutes');
const { checkBoard } = require('../middlewares/parentCheck');
const { requireUser } = require('../middlewares/currentUser');

// GET /api/boards (tableros del usuario actual)
router.get('/', requireUser, boardController.getBoards);

// POST /api/boards (el dueño es el usuario actual)
router.post('/', requireUser, boardController.createBoard);

// GET /api/boards/:boardId
router.get('/:boardId', checkBoard, boardController.getBoard);

// DELETE /api/boards/:boardId (borrado en cascada de Columnas y Tickets)
router.delete('/:boardId', checkBoard, boardController.deleteBoard);

// Anidamos las rutas de columnas dentro de los tableros
// Esto ataja todas las peticiones a /api/boards/:boardId/columns
router.use('/:boardId/columns', columnRoutes);

module.exports = router;
