// Ejecuta el seed de forma manual: npm run seed
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { seedDemoUser } = require('./seedDemoUser');

mongoose.connect(process.env.MONGO_URI)
    .then(seedDemoUser)
    .then((user) => {
        console.log(user ? `✅ Seed completo (usuario: ${user.email})` : '⚠️  Seed incompleto: revisar las variables DEMO_USER_*');
    })
    .catch((error) => {
        console.error('❌ Error al ejecutar el seed:', error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
