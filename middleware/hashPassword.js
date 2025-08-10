const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

// Hashear contraseña antes de guardar usuario
async function hashPasswordIfNeeded(req, res, next) {
  if (req.body.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    } catch (err) {
      return res.status(500).json({ error: 'Error al hashear contraseña' });
    }
  }
  next();
}

module.exports = hashPasswordIfNeeded;
