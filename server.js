const { WebSocketServer, WebSocket } = require("ws");

const ws1 = new WebSocketServer({port:8080});

function broadcast(data) {
if(typeof data !== "object") return;
const jsonPayload = JSON.stringify(data);
for(const client of ws1.clients){
    if(client.readyState === WebSocket.OPEN){
        client.send(jsonPayload);  
}
}
}

function onlineUsers(){
    broadcast({ 
        type:"count",
        count: ws1.clients.size
    });
}

ws1.on("connection", (socket) => {
console.log("connection established");
onlineUsers();


socket.on("message", (data) => {
    try{
        var msg = JSON.parse(data.toString());
    }
    catch (error){
        return;
    }

    if(msg.type === "chat" && msg.text && msg.text.trim()){
        broadcast({ 
            type:"chat",
            name: String(msg.name).slice(0,20),
            text: String(msg.text.trim()).slice(0,500),
            time: new Date().toLocaleTimeString()

        });
    }
  });

socket.on("close",  (code) => {
    console.log(code ,"Connection closed");
    onlineUsers();
})
});

console.log("Server running on ws://localhost:8080");
