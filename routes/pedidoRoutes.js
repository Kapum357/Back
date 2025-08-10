const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedidoController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, pedidoController.createPedido);
router.get('/', authenticateToken, pedidoController.getPedidos);
router.get('/:id', authenticateToken, pedidoController.getPedidoById);
router.put('/:id', authenticateToken, pedidoController.updatePedido);
router.delete('/:id', authenticateToken, pedidoController.deletePedido);

module.exports = router;
