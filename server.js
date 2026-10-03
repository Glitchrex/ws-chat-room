const { WebSocketServer, WebSocket } = require("ws");

const ws1 = new WebSocketServer({port:8080});
ws1.on("connection", (socket) => {
console.log("connection established");


socket.on("message", (data) => {
    const text = data.toString(); // data arrives as a Buffer
    console.log("received:", text);
    for (const client of ws1.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(text);
        }
    }
  });

socket.on("close",  (code) => {
    console.log(code ,"Connection closed");
})
});

console.log("Server running on ws://localhost:8080");
