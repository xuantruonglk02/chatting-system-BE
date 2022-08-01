const userController = require('../../controllers/user.controller');

const sockets = [];

const initializeSocket = (socket) => {
  socket.on('user:connect', (data) => {
    addNewSocket(socket);
    if (data.userId) {
      userController.userOnline(data.userId, socket.id);
      userController.getConversationIdsOfUser(data.userId, (roomIds) => {
        applyRoomsToSocket(socket.id, roomIds);
      });
    }
  });
  socket.on('disconnect', () => {
    removeSocket(socket);
    userController.userOffline(socket.id);
  });
}

const addNewSocket = (socket) => {
  sockets.push({
    id: socket.id,
    socket: socket
  });
}

const removeSocket = (socket) => {
  const index = sockets.findIndex(_socket => _socket.id === socket.id);
  sockets.splice(index, 1);
}

const addSocketsToRoom = (roomId, socketIds) => {
  socketIds.forEach(socketId => {
    const index = sockets.findIndex(_socket => _socket.id === socketId);
    if (index === -1) return;
    sockets[index].socket.join(roomId);
  });
}

const applyRoomsToSocket = (socketId, roomIds) => {
  const index = sockets.findIndex(_socket => _socket.id === socketId);
  roomIds.forEach(roomId => {
    if (index !== -1)
      sockets[index].socket.join(roomId);
  });
}

module.exports = {
  initializeSocket,
  addSocketsToRoom,
  applyRoomsToSocket
}
