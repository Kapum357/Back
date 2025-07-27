// socket.js
const socketio = require('socket.io');
let io;

function initSocket(server) {
    io = socketio(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);
        // Listener para que el cliente se una a su sala de usuario
        socket.on('joinUserRoom', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                console.log(`Socket ${socket.id} unido a sala user_${userId}`);
            }
        });
    });
}

// order: debe tener .usuario (ObjectId o string), .estado, ._id
function emitOrderStatusChange(order) {
    if (io && order && order.usuario) {
        // Emitir solo a la sala del usuario
        io.to(`user_${order.usuario}`).emit('orderStatusChanged', {
            status: order.estado,
            orderId: order._id
        });
    }
}

module.exports = { initSocket, emitOrderStatusChange };
