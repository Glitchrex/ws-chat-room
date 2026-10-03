const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 8080;

// Tiny HTTP server so the host has something to health-check
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
});

const ws1 = new WebSocketServer({ server });

function broadcast(data) {
  if (typeof data !== "object") return;
  const jsonPayload = JSON.stringify(data);
  for (const client of ws1.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonPayload);
    }
  }
}

function onlineUsers() {
  broadcast({ type: "count", count: ws1.clients.size });
}

ws1.on("connection", (socket) => {
  console.log("connection established");
  socket.isAlive = true;
  socket.on("pong", () => { socket.isAlive = true; });
  onlineUsers();

  socket.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (error) {
      return;
    }

    if (msg.type === "chat" && msg.text && msg.text.trim()) {
      broadcast({
        type: "chat",
        name: String(msg.name || "anon").slice(0, 20),
        text: String(msg.text.trim()).slice(0, 500),
        time: new Date().toLocaleTimeString(),
      });
    }
  });

  socket.on("close", (code) => {
    console.log(code, "Connection closed");
    onlineUsers();
  });
});

// Every 30s: drop sockets that didn't answer the last ping, then ping the rest
setInterval(() => {
  for (const client of ws1.clients) {
    if (!client.isAlive) { client.terminate(); continue; }
    client.isAlive = false;
    client.ping();
  }
}, 30000);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));