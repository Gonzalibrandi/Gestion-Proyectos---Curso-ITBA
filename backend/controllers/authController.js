const User = require('../models/User');
const { isNonEmptyString } = require('../utils/validation');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
            return res.status(400).json({ error: "El email y la contraseña son obligatorios y deben ser texto" });
        }

        // La contraseña tiene select: false, así que hay que pedirla explícitamente para compararla
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

        // Mismo mensaje si el email no existe o la contraseña es incorrecta (no revelar cuál falló)
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        // Solo se devuelven los datos públicos del usuario (nunca la contraseña)
        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login
};
