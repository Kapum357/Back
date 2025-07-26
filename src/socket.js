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
        // Se pueden agregar listeners personalizados aquí si se requiere
    });
}

function emitOrderStatusChange(order) {
    if (io) {
        io.emit('orderStatusChanged', order);
    }
}

module.exports = { initSocket, emitOrderStatusChange };
