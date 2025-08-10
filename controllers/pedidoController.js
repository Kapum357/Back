const Pedido = require('../models/Pedido');

exports.createPedido = async (req, res) => {
  try {
    const { productos, mesa, usuario } = req.body;
    // Validaciones básicas
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos un producto.' });
    }
    if (!mesa) {
      return res.status(400).json({ error: 'La mesa es obligatoria.' });
    }
    if (!usuario) {
      return res.status(400).json({ error: 'El usuario es obligatorio.' });
    }

    // Validar productos y cantidades
    for (const item of productos) {
      if (!item.producto || typeof item.cantidad !== 'number' || item.cantidad < 1) {
        return res.status(400).json({ error: 'Cada producto debe tener un ID válido y una cantidad mayor a 0.' });
      }
    }

    // Validar existencia de mesa y usuario
    const Mesa = require('../models/Mesa');
    const Usuario = require('../models/Usuario');
    const Producto = require('../models/Producto');

    const mesaExiste = await Mesa.findById(mesa);
    if (!mesaExiste) {
      return res.status(404).json({ error: 'Mesa no encontrada.' });
    }
    const usuarioExiste = await Usuario.findById(usuario);
    if (!usuarioExiste) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Validar existencia de productos
    for (const item of productos) {
      const prod = await Producto.findById(item.producto);
      if (!prod) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.producto}` });
      }
    }

    // Crear pedido con historial de estado inicial
    const pedido = new Pedido({
      productos,
      mesa,
      usuario,
      historialEstados: [{
        estado: 'En preparación',
        fecha: new Date(),
        usuario: usuario
      }]
    });
    await pedido.save();
    res.status(201).json(pedido);
  } catch (err) {
    console.error('Error al crear pedido:', err);
    res.status(500).json({ error: 'Error interno al registrar el pedido.' });
  }
};

exports.getPedidos = async (req, res) => {
  try {
    let filter = {};
    const { usuario, estado, nombreUsuario } = req.query;
    if (usuario) {
      filter.usuario = usuario;
    }
    if (estado) {
      filter.estado = estado;
    }
    let pedidos;
    if (nombreUsuario) {
      // Buscar usuarios cuyo nombre coincida parcialmente (insensible a mayúsculas/minúsculas)
      const Usuario = require('../models/Usuario');
      const usuarios = await Usuario.find({ nombre: { $regex: nombreUsuario, $options: 'i' } }, '_id');
      const usuarioIds = usuarios.map(u => u._id);
      if (usuarioIds.length === 0) {
        return res.json([]); // No hay usuarios que coincidan
      }
      filter.usuario = { $in: usuarioIds };
    }
    pedidos = await Pedido.find(filter).populate('productos.producto mesa usuario');
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPedidoById = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).populate('productos.producto mesa usuario');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePedido = async (req, res) => {
  try {
    const { productos, mesa, usuario, estado } = req.body;
    // Validaciones básicas
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos un producto.' });
    }
    if (!mesa) {
      return res.status(400).json({ error: 'La mesa es obligatoria.' });
    }
    if (!usuario) {
      return res.status(400).json({ error: 'El usuario es obligatorio.' });
    }

    // Validar productos y cantidades
    for (const item of productos) {
      if (!item.producto || typeof item.cantidad !== 'number' || item.cantidad < 1) {
        return res.status(400).json({ error: 'Cada producto debe tener un ID válido y una cantidad mayor a 0.' });
      }
    }

    // Validar existencia de mesa y usuario
    const Mesa = require('../models/Mesa');
    const Usuario = require('../models/Usuario');
    const Producto = require('../models/Producto');

    const mesaExiste = await Mesa.findById(mesa);
    if (!mesaExiste) {
      return res.status(404).json({ error: 'Mesa no encontrada.' });
    }
    const usuarioExiste = await Usuario.findById(usuario);
    if (!usuarioExiste) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Validar existencia de productos
    for (const item of productos) {
      const prod = await Producto.findById(item.producto);
      if (!prod) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.producto}` });
      }
    }

    // Buscar el pedido actual
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Verificar si el estado cambió y registrar en historialEstados
    let estadoActual = pedido.estado;
    if (estado && estado !== estadoActual) {
      pedido.historialEstados.push({
        estado: estado,
        fecha: new Date(),
        usuario: req.user && req.user.id ? req.user.id : usuario
      });
      pedido.estado = estado;
    }

    // Actualizar otros campos
    pedido.productos = productos;
    pedido.mesa = mesa;
    pedido.usuario = usuario;
    await pedido.save();
    res.json(pedido);
  } catch (err) {
    console.error('Error al actualizar pedido:', err);
    res.status(500).json({ error: 'Error interno al actualizar el pedido.' });
  }
};

exports.deletePedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ message: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
