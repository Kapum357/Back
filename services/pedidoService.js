const Pedido = require('../models/Pedido');

module.exports = {
  async findById(id) {
    return Pedido.findById(id).populate('productos.producto mesa usuario');
  },
  async findAll() {
    return Pedido.find().populate('productos.producto mesa usuario');
  },
  async create(data) {
    const pedido = new Pedido(data);
    return pedido.save();
  },
  async update(id, data) {
    return Pedido.findByIdAndUpdate(id, data, { new: true }).populate('productos.producto mesa usuario');
  },
  async delete(id) {
    return Pedido.findByIdAndDelete(id);
  }
};
