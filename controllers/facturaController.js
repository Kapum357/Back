const Factura = require('../models/Factura');

exports.createFactura = async (req, res) => {
  try {
    const factura = new Factura(req.body);
    await factura.save();
    res.status(201).json(factura);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find().populate('pedido');
    res.json(facturas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFacturaById = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id).populate('pedido');
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(factura);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFactura = async (req, res) => {
  try {
    const factura = await Factura.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(factura);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteFactura = async (req, res) => {
  try {
    const factura = await Factura.findByIdAndDelete(req.params.id);
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json({ message: 'Factura eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
