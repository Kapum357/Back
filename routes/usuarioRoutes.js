const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');
const hashPasswordIfNeeded = require('../middleware/hashPassword');
const { authenticateToken } = require('../middleware/auth');

// Registro de usuario (público, con hash de contraseña)
router.post('/', hashPasswordIfNeeded, usuarioController.createUsuario);
// Rutas protegidas
router.get('/', authenticateToken, usuarioController.getUsuarios);
router.get('/:id', authenticateToken, usuarioController.getUsuarioById);
router.put('/:id', authenticateToken, hashPasswordIfNeeded, usuarioController.updateUsuario);
router.delete('/:id', authenticateToken, usuarioController.deleteUsuario);

module.exports = router;
