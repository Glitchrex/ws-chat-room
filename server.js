const { WebSocketServer } = require("ws");

const ws1 = new WebSocketServer({port:8080});
ws1.on("connection", (socket) => {
console.log("connection established");

socket.on("close",  (code) => {
    console.log(code ,"Connection closed");

})
})

console.log("Server running on ws://localhost:8080");
