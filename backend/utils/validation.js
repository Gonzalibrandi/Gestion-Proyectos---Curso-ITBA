// Valida el formato de 24 caracteres hexadecimales de un ObjectId de MongoDB
const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// Valida que el valor sea un texto con contenido (no vacío ni solo espacios)
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

// Valores permitidos para la prioridad de un ticket (compartidos por el modelo y los controladores)
const TICKET_PRIORITIES = ['low', 'medium', 'high'];
const isValidPriority = (value) => TICKET_PRIORITIES.includes(value);

module.exports = {
    isValidObjectId,
    isNonEmptyString,
    TICKET_PRIORITIES,
    isValidPriority
};
