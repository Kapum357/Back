const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    cantidad: { type: Number, required: true }
  }],
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Mesa', required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estado: { type: String, enum: ['En preparación', 'Listo', 'Servido'], default: 'En preparación' },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', pedidoSchema);
