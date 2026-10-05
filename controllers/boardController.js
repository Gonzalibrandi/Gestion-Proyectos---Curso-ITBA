const Board = require('../models/Board');

const createBoard = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "El nombre del tablero es obligatorio" });
        }
        
        const board = new Board({ name, description });
        await board.save();
        
        return res.status(201).json(board);
    } catch (error) {
        return res.status(500).json({ error: "Error al crear el tablero" });
    }
};

const getBoard = async (req, res) => {
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
        return res.status(500).json({ error: "Error al obtener el tablero poblado" });
    }
};

module.exports = {
    createBoard,
    getBoard
};
