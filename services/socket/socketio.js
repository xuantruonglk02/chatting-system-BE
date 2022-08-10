const userController = require('../../controllers/user.controller');

const sockets = [];

const initializeSocket = (socket) => {
  socket.on('user:connect', (data) => {
    if (data.userId) {
      addNewSocket(data.userId, socket);
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

const addNewSocket = (userId, socket) => {
  sockets.push({
    userId: userId,
    id: socket.id,
    socket: socket
  });
}

const removeSocket = (socket) => {
  const index = sockets.findIndex(_socket => _socket.id === socket.id);
  sockets.splice(index, 1);
}

const addSocketsToRoom = (roomId, socketIds) => {
  const _roomId = roomId.toString();
  socketIds.forEach(socketId => {
    const index = sockets.findIndex(_socket => _socket.id === socketId);
    if (index === -1) return;
    sockets[index].socket.join(_roomId);
  });
}

const applyRoomsToSocket = (socketId, roomIds) => {
  const index = sockets.findIndex(_socket => _socket.id === socketId);
  roomIds.forEach(roomId => {
    if (index !== -1)
      sockets[index].socket.join(roomId.toString());
  });
}

module.exports = {
  initializeSocket,
  addSocketsToRoom,
  applyRoomsToSocket
}
