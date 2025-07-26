const mongoose = require('mongoose');

const mesaSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true },
  estado: { type: String, enum: ['libre', 'ocupada', 'reservada'], default: 'libre' }
});

module.exports = mongoose.model('Mesa', mesaSchema);
