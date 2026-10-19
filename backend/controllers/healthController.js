// Health check para la plataforma de despliegue (Render): responde 200 si el servidor está en pie
const getHealth = (req, res) => {
    return res.status(200).json({ status: 'ok' });
};

module.exports = {
    getHealth
};
