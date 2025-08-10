const express = require('express');
const router = express.Router();

const facturaController = require('../controllers/facturaController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, facturaController.createFactura);
router.get('/', authenticateToken, facturaController.getFacturas);
router.get('/:id', authenticateToken, facturaController.getFacturaById);
router.put('/:id', authenticateToken, facturaController.updateFactura);
router.delete('/:id', authenticateToken, facturaController.deleteFactura);

module.exports = router;
