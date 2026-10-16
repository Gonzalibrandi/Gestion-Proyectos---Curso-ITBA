const Board = require('../models/Board');
const { isNonEmptyString } = require('../utils/validation');

const createBoard = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!isNonEmptyString(name)) {
            return res.status(400).json({ error: "El nombre del tablero es obligatorio y debe ser un texto" });
        }

        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ error: "La descripción del tablero debe ser un texto" });
        }

        const board = new Board({ name, description });
        await board.save();

        return res.status(201).json(board);
    } catch (error) {
        next(error); // El manejador global traduce validaciones a 400 y el resto a 500
    }
};

const getBoard = async (req, res, next) => {
    try {
        // req.board viene del middleware checkBoard, pero no tiene las columnas pobladas.
        // Poblamos las columnas y, a su vez, los tickets de cada columna.
        const board = await Board.findById(req.params.boardId)
            .populate({
                path: 'columns',
                populate: {
                    path: 'tickets'
                }
            });

        return res.status(200).json(board);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBoard,
    getBoard
};
