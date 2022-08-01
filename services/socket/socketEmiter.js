let io;

function initializeEmiter(_io) {
  io = _io;
}

function sendMessage(roomId, data) {
  io.to(roomId).emit('server:message', data);
  console.log(roomId);
}

module.exports = {
  initializeEmiter,
  sendMessage
}
