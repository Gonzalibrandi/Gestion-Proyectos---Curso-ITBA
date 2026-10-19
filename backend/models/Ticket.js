const mongoose = require('mongoose');
const { TICKET_PRIORITIES } = require('../utils/validation');

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título del ticket es obligatorio']
    },
    description: {
        type: String,
        default: ''
    },
    priority: {
        type: String,
        enum: {
            values: TICKET_PRIORITIES,
            message: `La prioridad del ticket debe ser una de: ${TICKET_PRIORITIES.join(', ')}`
        },
        default: 'medium'
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
