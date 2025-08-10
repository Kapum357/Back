const express = require('express');
const cors = require('cors');
const app = express();
// const jwt = require('jsonwebtoken');
const http = require('http');
const server = http.createServer(app);
// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestión de Pedidos',
      version: '1.0.0',
      description: 'Documentación pública de la API REST para recepción y gestión de pedidos',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Servidor local' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./src/app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const connectDB = require('./services/db');

// Conexión centralizada a MongoDB
connectDB();

// Login exclusivo para administrador
app.post('/login/admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Usuario.findOne({ username, password });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
        if (user.rol !== 'administrador') return res.status(403).json({ error: 'Acceso solo para administradores' });
        const accessToken = jwt.sign({ username: user.username, rol: user.rol }, 'secretkey');
        res.json({ accessToken });
    } catch (err) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});


app.use(express.json());
app.use(cors());

// Middleware de autenticación JWT (usamos el de /middleware/auth.js)
const { authenticateToken } = require('../middleware/auth');
// Importar modelos y rutas modulares
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const Mesa = require('../models/Mesa');
const roles = ['administrador', 'mesero', 'cocina'];
const mesaRoutes = require('../routes/mesaRoutes');
const productoRoutes = require('../routes/productoRoutes');
const pedidoRoutes = require('../routes/pedidoRoutes');
const facturaRoutes = require('../routes/facturaRoutes');

// Cliente
const clienteRoutes = require('../routes/clienteRoutes');

// Registro de usuario público, el resto protegido
const usuarioRoutes = require('../routes/usuarioRoutes');
const usuarioRouter = express.Router();
const usuarioController = require('../controllers/usuarioController');
const hashPasswordIfNeeded = require('../middleware/hashPassword');

// Registro público
usuarioRouter.post('/', hashPasswordIfNeeded, usuarioController.createUsuario);
// Rutas protegidas solo para admin
usuarioRouter.get('/', authenticateToken, authorizeRole('administrador'), usuarioController.getUsuarios);
usuarioRouter.get('/:id', authenticateToken, authorizeRole('administrador'), usuarioController.getUsuarioById);
usuarioRouter.put('/:id', authenticateToken, authorizeRole('administrador'), hashPasswordIfNeeded, usuarioController.updateUsuario);
usuarioRouter.delete('/:id', authenticateToken, authorizeRole('administrador'), usuarioController.deleteUsuario);
app.use('/api/usuarios', usuarioRouter);

// Rutas de clientes: públicas para crear y consultar, protegidas para editar/eliminar
app.use('/api/clientes', clienteRoutes);

// Rutas de mesas: solo GET es público, el resto protegido
const mesaRouter = express.Router();
const mesaController = require('../controllers/mesaController');
// GET público
mesaRouter.get('/', mesaController.getMesas);
mesaRouter.get('/:id', mesaController.getMesaById);
// Solo administrador puede crear, editar y eliminar
mesaRouter.post('/', authenticateToken, authorizeRole('administrador'), mesaController.createMesa);
mesaRouter.put('/:id', authenticateToken, authorizeRole('administrador'), mesaController.updateMesa);
mesaRouter.delete('/:id', authenticateToken, authorizeRole('administrador'), mesaController.deleteMesa);
app.use('/api/mesas', mesaRouter);

// Rutas de productos: solo GET es público, el resto protegido
const productoRouter = express.Router();
const productoController = require('../controllers/productoController');
// GET público
productoRouter.get('/', productoController.getProductos);
productoRouter.get('/:id', productoController.getProductoById);
// Solo administrador puede crear, editar y eliminar
productoRouter.post('/', authenticateToken, authorizeRole('administrador'), productoController.createProducto);
productoRouter.put('/:id', authenticateToken, authorizeRole('administrador'), productoController.updateProducto);
productoRouter.delete('/:id', authenticateToken, authorizeRole('administrador'), productoController.deleteProducto);
app.use('/api/productos', productoRouter);

// Permitir crear pedidos a cualquier usuario autenticado, pero proteger el resto solo para administradores
const pedidoRouter = express.Router();
const pedidoController = require('../controllers/pedidoController');
// Crear pedido: solo autenticado
pedidoRouter.post('/', authenticateToken, pedidoController.createPedido);
// El resto de las rutas: solo administrador
pedidoRouter.get('/', authenticateToken, authorizeRole('administrador'), pedidoController.getPedidos);
pedidoRouter.get('/:id', authenticateToken, authorizeRole('administrador'), pedidoController.getPedidoById);
pedidoRouter.put('/:id', authenticateToken, authorizeRole('administrador'), pedidoController.updatePedido);
pedidoRouter.delete('/:id', authenticateToken, authorizeRole('administrador'), pedidoController.deletePedido);
app.use('/api/pedidos', pedidoRouter);
app.use('/api/facturas', authenticateToken, authorizeRole('administrador'), facturaRoutes);

app.get('/', (req, res) => {
  res.send('API REST modular funcionando');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


function authorizeRole(role) {
    return (req, res, next) => {
        // Verifica que el token esté presente y el usuario tenga el rol adecuado
        if (!req.user || !req.user.rol) return res.status(401).json({ error: 'Token inválido o usuario no autenticado' });
        if (req.user.rol !== role) return res.status(403).json({ error: 'Acceso denegado: solo para ' + role });
        next();
    };
}


// Rutas de autenticación (login y registro)
const authRoutes = require('../routes/authRoutes');
app.use('/auth', authRoutes);

// Ruta protegida solo para administrador
app.get('/administrador', authenticateToken, authorizeRole('administrador'), (req, res) => {
    res.json({ message: 'Bienvenido administrador' });
});

// Ruta protegida solo para mesero
app.get('/mesero', authenticateToken, authorizeRole('mesero'), (req, res) => {
    res.json({ message: 'Bienvenido mesero' });
});

// Ruta protegida solo para cocina
app.get('/cocina', authenticateToken, authorizeRole('cocina'), (req, res) => {
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
// Obtener todos los pedidos (administrador y mesero)
app.get('/orders', authenticateToken, async (req, res) => {
    if (!["administrador", "mesero"].includes(req.user.rol)) return res.sendStatus(403);
    try {
        const pedidos = await Pedido.find();
        res.json(pedidos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// Crear pedido (mesero)
app.post('/orders', authenticateToken, authorizeRole('mesero'), async (req, res) => {
    const { table, items } = req.body;
    if (!table || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Datos incompletos' });
    try {
        const pedido = new Pedido({
            mesa: table,
            productos: items.map(i => ({ producto: i.productId, cantidad: i.quantity })),
            usuario: req.user && req.user.id ? req.user.id : undefined,
            estado: 'En preparación',
            historialEstados: [{
                estado: 'En preparación',
                fecha: new Date(),
                usuario: req.user && req.user.id ? req.user.id : undefined
            }],
            fecha: new Date()
        });
        await pedido.save();
        res.status(201).json({ message: 'Pedido creado', id: pedido._id });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear pedido' });
    }
});
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               table:
 *                 type: string
 *                 example: "Mesa 1"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: "123456"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Pedido creado correctamente
 *       400:
 *         description: Datos incompletos
 *       500:
 *         description: Error al crear pedido
 */

// Actualizar pedido (mesero y cocina)
app.put('/orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { table, items, status } = req.body;
    try {
        const pedido = await Pedido.findById(id);
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        let statusChanged = false;
        // Mesero puede actualizar mesa/items, cocina puede actualizar status
        if (req.user.rol === 'mesero') {
            if (table) pedido.mesa = table;
            if (items) pedido.productos = items.map(i => ({ producto: i.productId, cantidad: i.quantity }));
        }
        if (req.user.rol === 'cocina' && status && pedido.estado !== status) {
            pedido.estado = status;
            statusChanged = true;
        }
        if (req.user.rol === 'administrador') {
            if (table) pedido.mesa = table;
            if (items) pedido.productos = items.map(i => ({ producto: i.productId, cantidad: i.quantity }));
            if (status && pedido.estado !== status) {
                pedido.estado = status;
                statusChanged = true;
            }
        }
        // Registrar historial de estado si cambió
        if (statusChanged) {
            pedido.historialEstados = pedido.historialEstados || [];
            pedido.historialEstados.push({
                estado: pedido.estado,
                fecha: new Date(),
                usuario: req.user && req.user.id ? req.user.id : undefined
            });
        }
        await pedido.save();
        if (statusChanged) {
            // Emitir evento solo si el pedido tiene usuario
            emitOrderStatusChange({
                usuario: pedido.usuario,
                estado: pedido.estado,
                _id: pedido._id
            });
        }
        res.json({ message: 'Pedido actualizado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
});

// Consultar pedido por id (administrador, mesero, cocina)
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

// Eliminar pedido (solo administrador)
app.delete('/orders/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
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
app.get('/report/sales', authenticateToken, authorizeRole('administrador'), async (req, res) => {
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
app.get('/report/orders-by-date', authenticateToken, authorizeRole('administrador'), async (req, res) => {
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
app.get('/report/top-products', authenticateToken, authorizeRole('administrador'), async (req, res) => {
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

// Crear mesa (solo administrador)
app.post('/tables', authenticateToken, authorizeRole('administrador'), async (req, res) => {
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
app.put('/tables/:id/assign', authenticateToken, authorizeRole('mesero'), async (req, res) => {
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
app.put('/tables/:id/release', authenticateToken, authorizeRole('mesero'), async (req, res) => {
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
