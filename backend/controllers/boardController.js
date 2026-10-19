const Board = require('../models/Board');
const { isNonEmptyString } = require('../utils/validation');

const getBoards = async (req, res, next) => {
    try {
        // req.user viene del middleware requireUser: solo se listan los tableros del usuario actual
        const boards = await Board.find({ owner: req.user._id }).sort({ createdAt: -1 });

        return res.status(200).json(boards);
    } catch (error) {
        next(error);
    }
};

const createBoard = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!isNonEmptyString(name)) {
            return res.status(400).json({ error: "El nombre del tablero es obligatorio y debe ser un texto" });
        }

        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ error: "La descripción del tablero debe ser un texto" });
        }

        // El dueño del tablero es el usuario actual (inyectado por requireUser)
        const board = new Board({ name, description, owner: req.user._id });
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

const deleteBoard = async (req, res, next) => {
    try {
        // req.board viene inyectado por el middleware checkBoard
        // Usamos deleteOne() en el documento para disparar los hooks de Mongoose (borrado en cascada de Columnas y Tickets)
        await req.board.deleteOne();

        return res.status(204).send(); // 204 No Content
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBoards,
    createBoard,
    getBoard,
    deleteBoard
};
