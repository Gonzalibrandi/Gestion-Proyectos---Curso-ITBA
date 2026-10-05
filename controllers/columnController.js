const Column = require('../models/Column');

const createColumn = async (req, res) => {
    try {
        const { name } = req.body;
        const { boardId } = req.params; // Viene garantizado y validado por el middleware checkBoard

        if (!name) {
            return res.status(400).json({ error: "El nombre de la columna es obligatorio" });
        }

        const column = new Column({ name, board: boardId });
        await column.save();
        
        return res.status(201).json(column);
    } catch (error) {
        return res.status(500).json({ error: "Error al crear la columna" });
    }
};

const deleteColumn = async (req, res) => {
    try {
        // req.column viene inyectado por el middleware checkColumn
        // Usamos deleteOne() en el documento para disparar los hooks de Mongoose (borrado en cascada de Tickets)
        await req.column.deleteOne();
        
        return res.status(204).send(); // 204 No Content
    } catch (error) {
        return res.status(500).json({ error: "Error al eliminar la columna" });
    }
};

module.exports = {
    createColumn,
    deleteColumn
};
