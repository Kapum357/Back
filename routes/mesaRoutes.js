const express = require('express');
const router = express.Router();

const mesaController = require('../controllers/mesaController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, mesaController.createMesa);
router.get('/', authenticateToken, mesaController.getMesas);
router.get('/:id', authenticateToken, mesaController.getMesaById);
router.put('/:id', authenticateToken, mesaController.updateMesa);
router.delete('/:id', authenticateToken, mesaController.deleteMesa);

module.exports = router;
