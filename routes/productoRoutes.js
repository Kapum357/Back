const express = require('express');
const router = express.Router();

const productoController = require('../controllers/productoController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas protegidas excepto registro/login
router.post('/', authenticateToken, productoController.createProducto);
router.get('/', authenticateToken, productoController.getProductos);
router.get('/:id', authenticateToken, productoController.getProductoById);
router.put('/:id', authenticateToken, productoController.updateProducto);
router.delete('/:id', authenticateToken, productoController.deleteProducto);

module.exports = router;
