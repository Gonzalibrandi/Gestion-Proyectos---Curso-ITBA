const express = require('express');
// mergeParams: true es crucial para que este router pueda acceder a :boardId y :columnId
const router = express.Router({ mergeParams: true }); 
const ticketController = require('../controllers/ticketController');
const { checkBoard, checkColumn, checkTicket } = require('../middlewares/parentCheck');

// POST /api/boards/:boardId/columns/:columnId/tickets
router.post('/', checkBoard, checkColumn, ticketController.createTicket);

// PATCH /api/boards/:boardId/columns/:columnId/tickets/:ticketId
router.patch('/:ticketId', checkBoard, checkColumn, checkTicket, ticketController.updateTicket);

// DELETE /api/boards/:boardId/columns/:columnId/tickets/:ticketId
router.delete('/:ticketId', checkBoard, checkColumn, checkTicket, ticketController.deleteTicket);

module.exports = router;
