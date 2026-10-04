const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 8080;

// Static files the browser client needs, served from the same origin as the socket
const STATIC = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/index.js": ["index.js", "text/javascript; charset=utf-8"],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
};

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;

  // Health check endpoint for the host
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }

  const file = STATIC[pathname];
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("not found");
  }

  fs.readFile(path.join(__dirname, file[0]), (err, body) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("error");
    }
    res.writeHead(200, { "Content-Type": file[1] });
    res.end(body);
  });
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
  broadcast({ type: "onlineUsers", count: ws1.clients.size });
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