const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'El título del ticket es obligatorio'] 
    },
    description: { 
        type: String,
        default: ''
    },
    column: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Column', 
        required: [true, 'El ticket debe pertenecer a una columna'] 
    },
    board: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Board', 
        required: [true, 'El ticket debe referenciar a un tablero para facilitar el borrado en cascada'] 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Ticket', ticketSchema);
