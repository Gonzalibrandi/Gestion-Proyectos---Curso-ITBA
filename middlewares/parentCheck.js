const Board = require('../models/Board');
const Column = require('../models/Column');
const Ticket = require('../models/Ticket');

// Utilidad para validar el formato de 24 caracteres hexadecimales de MongoDB
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Middleware para validar que el Tablero existe.
 */
const checkBoard = async (req, res, next) => {
    const { boardId } = req.params;
    
    if (!boardId) return next();

    if (!isValidObjectId(boardId)) {
        return res.status(400).json({ error: "El ID del Tablero proporcionado no tiene un formato válido" });
    }

    try {
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ error: "El Tablero (Board) solicitado no existe (Parent Check fallido)" });
        }
        
        req.board = board; // Guardamos el tablero en la request para uso en controladores
        next();
    } catch (error) {
        return res.status(500).json({ error: "Error interno al verificar el Tablero" });
    }
};

/**
 * Middleware para validar que la Columna existe y pertenece al Tablero.
 */
const checkColumn = async (req, res, next) => {
    const { boardId, columnId } = req.params;
    
    if (!columnId) return next();

    if (!isValidObjectId(columnId)) {
        return res.status(400).json({ error: "El ID de la Columna proporcionado no tiene un formato válido" });
    }

    try {
        const column = await Column.findById(columnId);
        if (!column) {
            return res.status(404).json({ error: "La Columna solicitada no existe" });
        }

        // Aislamiento de rutas: Si la URL trae boardId, verificamos que la columna realmente le pertenezca
        if (boardId && column.board.toString() !== boardId) {
            return res.status(400).json({ error: "Aislamiento de Rutas: La columna solicitada existe pero NO pertenece al tablero especificado en la URL" });
        }

        req.column = column;
        next();
    } catch (error) {
        return res.status(500).json({ error: "Error interno al verificar la Columna" });
    }
};

/**
 * Middleware para validar que el Ticket existe y pertenece a la Columna.
 */
const checkTicket = async (req, res, next) => {
    const { columnId, ticketId } = req.params;
    
    if (!ticketId) return next();

    if (!isValidObjectId(ticketId)) {
        return res.status(400).json({ error: "El ID del Ticket proporcionado no tiene un formato válido" });
    }

    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ error: "El Ticket solicitado no existe" });
        }

        // Aislamiento de rutas: Verificamos que el ticket realmente pertenezca a la columna de la URL
        if (columnId && ticket.column.toString() !== columnId) {
            return res.status(400).json({ error: "Aislamiento de Rutas: El ticket solicitado existe pero NO pertenece a la columna especificada en la URL" });
        }

        req.ticket = ticket;
        next();
    } catch (error) {
        return res.status(500).json({ error: "Error interno al verificar el Ticket" });
    }
};

module.exports = {
    checkBoard,
    checkColumn,
    checkTicket
};
