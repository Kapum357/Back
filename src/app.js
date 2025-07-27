const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const http = require('http');
const server = http.createServer(app);
const { initSocket, emitOrderStatusChange } = require('./socket');
const connectDB = require('./services/db');

// Conexión centralizada a MongoDB

// Inicializar socket.io
initSocket(server);
connectDB();


app.use(express.json());
app.use(cors());

// Middleware de autenticación JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
// Importar modelos y rutas modulares
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const Mesa = require('../models/Mesa');
const roles = ['admin', 'waiter', 'kitchen'];
const usuarioRoutes = require('../routes/usuarioRoutes');
const mesaRoutes = require('../routes/mesaRoutes');
const productoRoutes = require('../routes/productoRoutes');
const pedidoRoutes = require('../routes/pedidoRoutes');
const facturaRoutes = require('../routes/facturaRoutes');

// Usar rutas REST protegidas por JWT
app.use('/api/usuarios', authenticateToken, usuarioRoutes);
app.use('/api/mesas', authenticateToken, mesaRoutes);
app.use('/api/productos', authenticateToken, productoRoutes);
app.use('/api/pedidos', authenticateToken, pedidoRoutes);

app.get('/', (req, res) => {
  res.send('API REST modular funcionando');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Middleware para verificar token y rol
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, 'secretkey', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) return res.sendStatus(403);
        next();
    };
}

// Registro de usuario
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!roles.includes(role)) return res.status(400).json({ error: 'Rol inválido' });
    try {
        const exists = await Usuario.findOne({ username });
        if (exists) return res.status(400).json({ error: 'Usuario ya existe' });
        const user = new Usuario({ username, password, role });
        await user.save();
        res.status(201).json({ message: 'Usuario registrado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Login de usuario
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Usuario.findOne({ username, password });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
        const accessToken = jwt.sign({ username: user.username, role: user.role }, 'secretkey');
        res.json({ accessToken });
    } catch (err) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Ruta protegida solo para admin
app.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.json({ message: 'Bienvenido administrador' });
});

// Ruta protegida solo para mesero
app.get('/waiter', authenticateToken, authorizeRole('waiter'), (req, res) => {
    res.json({ message: 'Bienvenido mesero' });
});

// Ruta protegida solo para cocina
app.get('/kitchen', authenticateToken, authorizeRole('kitchen'), (req, res) => {
    res.json({ message: 'Bienvenido cocina' });
});

// CRUD de productos/menú
// Obtener todos los productos (acceso público)
app.get('/products', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Crear producto (solo admin)
app.post('/products', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { name, type, price } = req.body;
    if (!name || !type || !price) return res.status(400).json({ error: 'Datos incompletos' });
    try {
        const producto = new Producto({ name, type, price });
        await producto.save();
        res.status(201).json({ message: 'Producto creado', id: producto._id });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// Actualizar producto (solo admin)
app.put('/products/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, type, price } = req.body;
    try {
        const producto = await Producto.findById(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        if (name) producto.name = name;
        if (type) producto.type = type;
        if (price) producto.price = price;
        await producto.save();
        res.json({ message: 'Producto actualizado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// Eliminar producto (solo admin)
app.delete('/products/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const producto = await Producto.findByIdAndDelete(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// CRUD de pedidos
// Obtener todos los pedidos (admin y mesero)
app.get('/orders', authenticateToken, async (req, res) => {
    if (!["admin", "waiter"].includes(req.user.role)) return res.sendStatus(403);
    try {
        const pedidos = await Pedido.find();
        res.json(pedidos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// Crear pedido (mesero)
app.post('/orders', authenticateToken, authorizeRole('waiter'), async (req, res) => {
    const { table, items } = req.body;
    if (!table || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Datos incompletos' });
    try {
        const pedido = new Pedido({ table, items, status: 'pendiente', createdAt: new Date().toISOString() });
        await pedido.save();
        res.status(201).json({ message: 'Pedido creado', id: pedido._id });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear pedido' });
    }
});

// Actualizar pedido (mesero y cocina)
app.put('/orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { table, items, status } = req.body;
    try {
        const pedido = await Pedido.findById(id);
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        let statusChanged = false;
        // Mesero puede actualizar mesa/items, cocina puede actualizar status
        if (req.user.role === 'waiter') {
            if (table) pedido.table = table;
            if (items) pedido.items = items;
        }
        if (req.user.role === 'kitchen' && status && pedido.status !== status) {
            pedido.status = status;
            statusChanged = true;
        }
        if (req.user.role === 'admin') {
            if (table) pedido.table = table;
            if (items) pedido.items = items;
            if (status && pedido.status !== status) {
                pedido.status = status;
                statusChanged = true;
            }
        }
        await pedido.save();
        if (statusChanged) {
            // Emitir evento solo si el pedido tiene usuario
            emitOrderStatusChange({
                usuario: pedido.usuario,
                estado: pedido.status || pedido.estado,
                _id: pedido._id
            });
        }
        res.json({ message: 'Pedido actualizado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
});

// Consultar pedido por id (admin, mesero, cocina)
app.get('/orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const pedido = await Pedido.findById(id);
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json(pedido);
    } catch (err) {
        res.status(500).json({ error: 'Error al consultar pedido' });
    }
});

// Eliminar pedido (solo admin)
app.delete('/orders/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const pedido = await Pedido.findByIdAndDelete(id);
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json({ message: 'Pedido eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
});


// Reporte: Ventas totales
app.get('/report/sales', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const pedidos = await Pedido.find();
        let totalSales = 0;
        for (const order of pedidos) {
            for (const item of order.items) {
                const product = await Producto.findById(item.productId);
                totalSales += product ? product.price * item.quantity : 0;
            }
        }
        res.json({ totalSales });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
});

// Reporte: Pedidos por fecha
app.get('/report/orders-by-date', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Fecha requerida (YYYY-MM-DD)' });
    try {
        const pedidos = await Pedido.find({ createdAt: { $regex: `^${date}` } });
        res.json({ count: pedidos.length, orders: pedidos });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos por fecha' });
    }
});

// Reporte: Productos más vendidos
app.get('/report/top-products', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const pedidos = await Pedido.find();
        const productSales = {};
        for (const order of pedidos) {
            for (const item of order.items) {
                if (!productSales[item.productId]) productSales[item.productId] = 0;
                productSales[item.productId] += item.quantity;
            }
        }
        const topProducts = [];
        for (const [productId, quantity] of Object.entries(productSales)) {
            const product = await Producto.findById(productId);
            if (product) topProducts.push({ ...product.toObject(), sold: quantity });
        }
        topProducts.sort((a, b) => b.sold - a.sold);
        res.json({ topProducts });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos más vendidos' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// CRUD de mesas
// Obtener todas las mesas
app.get('/tables', authenticateToken, async (req, res) => {
    try {
        const mesas = await Mesa.find();
        res.json(mesas);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener mesas' });
    }
});

// Crear mesa (solo admin)
app.post('/tables', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { status } = req.body;
    try {
        const mesa = new Mesa({ status: status || 'libre', assignedTo: null });
        await mesa.save();
        res.status(201).json({ message: 'Mesa creada', id: mesa._id });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear mesa' });
    }
});

// Asignar mesa a mesero (solo mesero)
app.put('/tables/:id/assign', authenticateToken, authorizeRole('waiter'), async (req, res) => {
    const { id } = req.params;
    try {
        const mesa = await Mesa.findById(id);
        if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
        if (mesa.status !== 'libre') return res.status(400).json({ error: 'Mesa no disponible' });
        mesa.status = 'ocupada';
        mesa.assignedTo = req.user.username;
        await mesa.save();
        res.json({ message: 'Mesa asignada', mesa });
    } catch (err) {
        res.status(500).json({ error: 'Error al asignar mesa' });
    }
});

// Liberar mesa (solo mesero)
app.put('/tables/:id/release', authenticateToken, authorizeRole('waiter'), async (req, res) => {
    const { id } = req.params;
    try {
        const mesa = await Mesa.findById(id);
        if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
        if (mesa.assignedTo !== req.user.username) return res.status(403).json({ error: 'No autorizado para liberar esta mesa' });
        mesa.status = 'libre';
        mesa.assignedTo = null;
        await mesa.save();
        res.json({ message: 'Mesa liberada', mesa });
    } catch (err) {
        res.status(500).json({ error: 'Error al liberar mesa' });
    }
});

// Consultar estado de una mesa
app.get('/tables/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const mesa = await Mesa.findById(id);
        if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
        res.json(mesa);
    } catch (err) {
        res.status(500).json({ error: 'Error al consultar mesa' });
    }
});
