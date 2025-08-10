const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'El email no es válido']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    match: [/^\d{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos']
  },
  direccion: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Cliente', clienteSchema);
