const Usuario = require('../models/Usuario');

module.exports = {
  async findById(id) {
    return Usuario.findById(id);
  },
  async findAll() {
    return Usuario.find();
  },
  async create(data) {
    const usuario = new Usuario(data);
    return usuario.save();
  },
  async update(id, data) {
    return Usuario.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return Usuario.findByIdAndDelete(id);
  },
  async findByEmail(email) {
    return Usuario.findOne({ email });
  }
};
