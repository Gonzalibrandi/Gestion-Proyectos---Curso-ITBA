const Ticket = require('../models/Ticket');
const Column = require('../models/Column');
const { isValidObjectId, isNonEmptyString } = require('../utils/validation');

const createTicket = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const { boardId, columnId } = req.params; // checkBoard y checkColumn garantizan su validez

        if (!isNonEmptyString(title)) {
            return res.status(400).json({ error: "El título del ticket es obligatorio y debe ser un texto" });
        }

        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ error: "La descripción del ticket debe ser un texto" });
        }

        const ticket = new Ticket({
            title,
            description,
            column: columnId,
            board: boardId
        });

        await ticket.save();

        return res.status(201).json(ticket);
    } catch (error) {
        next(error); // El manejador global traduce validaciones a 400 y el resto a 500
    }
};

const updateTicket = async (req, res, next) => {
    try {
        const { title, description, newColumnId } = req.body;
        const { boardId } = req.params;
        const ticket = req.ticket; // ticket original validado por checkTicket

        // Validación del payload: solo se validan los campos enviados (PATCH parcial)
        if (title !== undefined && !isNonEmptyString(title)) {
            return res.status(400).json({ error: "El título del ticket no puede estar vacío y debe ser un texto" });
        }

        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ error: "La descripción del ticket debe ser un texto" });
        }

        if (newColumnId !== undefined && !isValidObjectId(newColumnId)) {
            return res.status(400).json({ error: "El ID de la columna destino no tiene un formato válido" });
        }

        let updated = false;

        // Idempotencia: Aplicar cambios solo si difieren del estado actual
        if (title !== undefined && title !== ticket.title) {
            ticket.title = title;
            updated = true;
        }

        if (description !== undefined && description !== ticket.description) {
            ticket.description = description;
            updated = true;
        }

        // Mover ticket de columna (PATCH idempotente)
        if (newColumnId && newColumnId !== ticket.column.toString()) {
            // Validar que la nueva columna exista
            const newColumn = await Column.findById(newColumnId);
            if (!newColumn) {
                return res.status(404).json({ error: "La nueva columna de destino no existe" });
            }

            // Validar aislamiento: no se puede mover a una columna de OTRO tablero
            if (newColumn.board.toString() !== boardId) {
                return res.status(400).json({ error: "Aislamiento de Rutas: No puedes mover un ticket a una columna que pertenece a un tablero distinto" });
            }

            ticket.column = newColumnId;
            updated = true;
        }

        // Si nada cambió, simplemente devolvemos 200 OK con el ticket actual (Idempotencia pura)
        if (updated) {
            await ticket.save();
        }

        return res.status(200).json(ticket);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTicket,
    updateTicket
};
