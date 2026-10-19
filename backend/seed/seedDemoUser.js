const User = require('../models/User');
const Board = require('../models/Board');

/**
 * Crea el usuario único simulado a partir de las variables DEMO_USER_*.
 * Es idempotente: si ya existe un usuario, no crea otro.
 * Además asigna a ese usuario los tableros que no tengan dueño (creados antes de existir los usuarios).
 */
const seedDemoUser = async () => {
    const { DEMO_USER_NAME, DEMO_USER_EMAIL, DEMO_USER_PASSWORD } = process.env;

    let user = await User.findOne();

    if (!user) {
        if (!DEMO_USER_NAME || !DEMO_USER_EMAIL || !DEMO_USER_PASSWORD) {
            console.warn('⚠️  Faltan DEMO_USER_NAME, DEMO_USER_EMAIL o DEMO_USER_PASSWORD: no se creó el usuario único');
            return null;
        }

        // save() dispara el hook que hashea la contraseña
        user = await User.create({
            name: DEMO_USER_NAME,
            email: DEMO_USER_EMAIL,
            password: DEMO_USER_PASSWORD
        });
        console.log(`👤 Usuario único creado: ${user.email}`);
    }

    const { modifiedCount } = await Board.updateMany(
        { owner: { $exists: false } },
        { $set: { owner: user._id } }
    );
    if (modifiedCount > 0) {
        console.log(`📋 ${modifiedCount} tablero(s) sin dueño asignado(s) a ${user.email}`);
    }

    return user;
};

module.exports = { seedDemoUser };
