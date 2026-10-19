const User = require('../models/User');
const { isValidObjectId } = require('../utils/validation');

/**
 * Middleware que identifica al usuario actual a partir del header X-User-Id.
 * NO es autenticación real: el header solo indica qué usuario hace la petición.
 */
const requireUser = async (req, res, next) => {
    const userId = req.get('X-User-Id');

    if (!userId) {
        return res.status(401).json({ error: "Falta el header X-User-Id: es necesario iniciar sesión" });
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ error: "El header X-User-Id no tiene un formato de ID válido" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: "El usuario indicado en X-User-Id no existe" });
        }

        req.user = user; // Guardamos el usuario en la request para uso en controladores
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requireUser
};
