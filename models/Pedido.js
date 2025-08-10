const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    cantidad: { type: Number, required: true }
  }],
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Mesa', required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estado: { type: String, enum: ['En preparación', 'Listo', 'Servido'], default: 'En preparación' },
  fecha: { type: Date, default: Date.now },
  historialEstados: [{
    estado: { type: String, enum: ['En preparación', 'Listo', 'Servido'], required: true },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  }]
});

module.exports = mongoose.model('Pedido', pedidoSchema);
