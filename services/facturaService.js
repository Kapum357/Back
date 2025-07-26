const Factura = require('../models/Factura');

module.exports = {
  async findById(id) {
    return Factura.findById(id);
  },
  async findAll() {
    return Factura.find();
  },
  async create(data) {
    const factura = new Factura(data);
    return factura.save();
  },
  async update(id, data) {
    return Factura.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return Factura.findByIdAndDelete(id);
  }
};
