const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Usuario único simulado: la colección `users` tiene un solo documento, creado por el seed
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del usuario es obligatorio']
    },
    email: {
        type: String,
        required: [true, 'El email del usuario es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña del usuario es obligatoria'],
        select: false // Nunca se devuelve en las consultas, salvo que se pida con .select('+password')
    }
}, {
    timestamps: true
});

// Nunca exponer la contraseña al serializar el documento
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        return ret;
    }
});

// Hash de la contraseña antes de guardarla (nunca se guarda en texto plano)
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compara una contraseña en texto plano con el hash guardado
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
