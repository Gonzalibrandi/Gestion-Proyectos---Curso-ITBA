const Column = require('../models/Column');
const { isNonEmptyString } = require('../utils/validation');

const createColumn = async (req, res, next) => {
    try {
        const { name } = req.body;
        const { boardId } = req.params; // Viene garantizado y validado por el middleware checkBoard

        if (!isNonEmptyString(name)) {
            return res.status(400).json({ error: "El nombre de la columna es obligatorio y debe ser un texto" });
        }

        const column = new Column({ name, board: boardId });
        await column.save();

        return res.status(201).json(column);
    } catch (error) {
        next(error); // El manejador global traduce validaciones a 400 y el resto a 500
    }
};

const deleteColumn = async (req, res, next) => {
    try {
        // req.column viene inyectado por el middleware checkColumn
        // Usamos deleteOne() en el documento para disparar los hooks de Mongoose (borrado en cascada de Tickets)
        await req.column.deleteOne();

        return res.status(204).send(); // 204 No Content
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createColumn,
    deleteColumn
};
