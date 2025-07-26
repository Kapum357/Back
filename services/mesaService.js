const Mesa = require('../models/Mesa');

module.exports = {
  async findById(id) {
    return Mesa.findById(id);
  },
  async findAll() {
    return Mesa.find();
  },
  async create(data) {
    const mesa = new Mesa(data);
    return mesa.save();
  },
  async update(id, data) {
    return Mesa.findByIdAndUpdate(id, data, { new: true });
  },
  async delete(id) {
    return Mesa.findByIdAndDelete(id);
  }
};
