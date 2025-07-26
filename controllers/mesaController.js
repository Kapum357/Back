const Mesa = require('../models/Mesa');

exports.createMesa = async (req, res) => {
  try {
    const mesa = new Mesa(req.body);
    await mesa.save();
    res.status(201).json(mesa);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMesas = async (req, res) => {
  try {
    const mesas = await Mesa.find();
    res.json(mesas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMesaById = async (req, res) => {
  try {
    const mesa = await Mesa.findById(req.params.id);
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json(mesa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMesa = async (req, res) => {
  try {
    const mesa = await Mesa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json(mesa);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteMesa = async (req, res) => {
  try {
    const mesa = await Mesa.findByIdAndDelete(req.params.id);
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json({ message: 'Mesa eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
