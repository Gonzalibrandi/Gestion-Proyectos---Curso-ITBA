const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'El nombre del tablero es obligatorio'] 
    },
    description: { 
        type: String,
        default: ''
    }
}, { 
    timestamps: true 
});

// Virtual para obtener las columnas del tablero (cumple con "Obtiene un tablero con sus columnas pobladas")
boardSchema.virtual('columns', {
    ref: 'Column',
    localField: '_id',
    foreignField: 'board'
});

boardSchema.set('toJSON', { virtuals: true });
boardSchema.set('toObject', { virtuals: true });

// Borrado en Cascada: Al eliminar un Tablero, se eliminan sus Columnas y Tickets
// Hook para document.deleteOne()
boardSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    await mongoose.model('Column').deleteMany({ board: this._id });
    await mongoose.model('Ticket').deleteMany({ board: this._id });
    next();
});

// Hook para Model.findOneAndDelete() o findByIdAndDelete()
boardSchema.pre('findOneAndDelete', async function(next) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
        await mongoose.model('Column').deleteMany({ board: doc._id });
        await mongoose.model('Ticket').deleteMany({ board: doc._id });
    }
    next();
});

module.exports = mongoose.model('Board', boardSchema);
