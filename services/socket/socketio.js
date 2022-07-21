const userController = require('../../controllers/user.controller');

module.exports = (socket) => {
  socket.on('user:connect', (data) => {
    if (data.userId) {
      userController.userOnline(data.userId, socket.id);
    }
  });
  socket.on('disconnect', () => {
    userController.userOffline(socket.id);
  });
}
