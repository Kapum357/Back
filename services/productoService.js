const Producto = require('../models/Producto');

module.exports = {
  async findById(id) {
    return Producto.findById(id);
  },
  async findAll() {
    return Producto.find();
  },
  async create(data) {
    const producto = new Producto(data);
    return producto.save();
  },
  async update(id, data) {
    return Producto.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return Producto.findByIdAndDelete(id);
  }
};
