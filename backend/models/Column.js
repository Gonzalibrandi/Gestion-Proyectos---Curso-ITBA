const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'El nombre de la columna es obligatorio'] 
    },
    board: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Board', 
        required: [true, 'La columna debe pertenecer a un tablero'] 
    }
}, { 
    timestamps: true 
});

// Virtual para poblar los tickets de esta columna fácilmente (si fuera necesario)
columnSchema.virtual('tickets', {
    ref: 'Ticket',
    localField: '_id',
    foreignField: 'column'
});

columnSchema.set('toJSON', { virtuals: true });
columnSchema.set('toObject', { virtuals: true });

// Borrado en Cascada: Al eliminar una columna, eliminamos sus tickets.
// Hook para document.deleteOne()
columnSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    await mongoose.model('Ticket').deleteMany({ column: this._id });
    next();
});

// Hook para Model.findOneAndDelete() o findByIdAndDelete()
columnSchema.pre('findOneAndDelete', async function(next) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
        await mongoose.model('Ticket').deleteMany({ column: doc._id });
    }
    next();
});

module.exports = mongoose.model('Column', columnSchema);
