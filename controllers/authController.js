const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../middleware/auth');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    console.log('Login intento:', { email, password });
    if (!usuario) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    const validPassword = await bcrypt.compare(password, usuario.password);
    console.log('Password válida:', validPassword);
    if (!validPassword) {
      console.log('Contraseña incorrecta');
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, secretKey, { expiresIn: '8h' });
    res.json({ token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (err) {
    console.log('Error en login:', err);
    res.status(500).json({ error: err.message });
  }
};
