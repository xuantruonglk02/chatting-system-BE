let io;

function initializeEmiter(_io) {
  io = _io;
}

function sendMessage(data) {
  io.emit('server:message', data);
}

module.exports = {
  initializeEmiter,
  sendMessage
}
