// Valida el formato de 24 caracteres hexadecimales de un ObjectId de MongoDB
const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// Valida que el valor sea un texto con contenido (no vacío ni solo espacios)
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

module.exports = {
    isValidObjectId,
    isNonEmptyString
};
