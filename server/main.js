const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const sockets = new Set();
wss.on("connection", socket => {
  socket.on("close", () => sockets.delete(socket));

  // broadcast!
  socket.on("message", data => {
    for (const sock of sockets) {
      if (sock === socket) continue;
      if (sock.readyState !== WebSocket.OPEN) continue;

      sock.send(data);
    }
  });

  sockets.add(socket);
});
