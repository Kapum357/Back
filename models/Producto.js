const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  tipo: { type: String, enum: ['plato', 'bebida'], required: true }
});

module.exports = mongoose.model('Producto', productoSchema);
