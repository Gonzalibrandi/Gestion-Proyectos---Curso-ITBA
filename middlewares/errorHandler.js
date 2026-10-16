const mongoose = require('mongoose');

/**
 * Manejo de Rutas Inexistentes (404 Global)
 */
const notFound = (req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
};

/**
 * Manejo Global de Errores.
 * Traduce los errores conocidos a 400 Bad Request y reserva el 500 solo para fallas imprevistas.
 */
const errorHandler = (err, req, res, next) => {
    // Body con JSON malformado (lanzado por express.json())
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
    }

    // Falla de validación del esquema de Mongoose (ej. campo requerido o tipo incorrecto)
    if (err instanceof mongoose.Error.ValidationError) {
        const message = Object.values(err.errors).map((e) => e.message).join('. ');
        return res.status(400).json({ error: message });
    }

    // Valor que no se puede convertir al tipo esperado (ej. un ObjectId inválido)
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ error: `Valor inválido para el campo '${err.path}'` });
    }

    console.error(err.stack);
    return res.status(500).json({ error: "Error interno del servidor" });
};

module.exports = {
    notFound,
    errorHandler
};
