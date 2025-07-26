const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');

router.post('/', mesaController.createMesa);
router.get('/', mesaController.getMesas);
router.get('/:id', mesaController.getMesaById);
router.put('/:id', mesaController.updateMesa);
router.delete('/:id', mesaController.deleteMesa);

module.exports = router;
