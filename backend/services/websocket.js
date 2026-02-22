const socketIO = require('socket.io');

let io;

exports.init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // Verify token
    next();
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('subscribe-device', (deviceImei) => {
      socket.join(`device-${deviceImei}`);
    });

    socket.on('device-update-progress', (data) => {
      io.to(`device-${data.imei}`).emit('progress', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

exports.getIO = () => io;