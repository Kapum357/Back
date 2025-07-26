const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
  fecha: { type: Date, default: Date.now },
  total: { type: Number, required: true },
  metodoPago: { type: String, enum: ['efectivo', 'tarjeta', 'transferencia'], required: true },
  estado: { type: String, enum: ['pagada', 'pendiente'], default: 'pendiente' }
});

module.exports = mongoose.model('Factura', facturaSchema);
