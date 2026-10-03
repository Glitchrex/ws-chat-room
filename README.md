# WebSocket Chat Room

A real-time chat room built with **WebSockets**, **Node.js** and plain HTML/JavaScript. No frameworks, so the protocol itself is the thing on show.

![Demo](assets/demo.gif)

## Features

- Live messaging between any number of browser tabs
- Usernames and server-generated timestamps
- Online user counter
- Auto-reconnect with exponential backoff
- XSS-safe rendering
- TODO: add anything extra you build (typing indicator, rooms…)

## Tech stack

- Node.js + [`ws`](https://github.com/websockets/ws)
- Vanilla HTML and JavaScript (browser `WebSocket` API)

## Getting started

```bash
git clone https://github.com/Glitchrex/ws-chat-room.git
cd ws-chat-room
npm install
node server.js
```

Then open `index.html` in two browser tabs and start chatting.

## How it works

1. The browser opens a connection with `new WebSocket("ws://localhost:8080")`.
2. The server keeps every open connection in `wss.clients`.
3. When a client sends a message, the server validates it and **broadcasts** it to everyone.
4. Messages are JSON envelopes with a `type` field:

| Direction | Message |
|---|---|
| client → server | `{ "type": "chat", "name": "...", "text": "..." }` |
| server → all | `{ "type": "chat", "name", "text", "time" }` |
| server → all | `{ "type": "onlineUsers", "count": 3 }` |

## What I learned

- TODO: 2-3 sentences, e.g. the difference between the server object and a per-client socket
- TODO: why `readyState` is checked before sending
- TODO: why reconnecting means creating a new `WebSocket`

## Ideas for next steps

- [ ] Chat rooms
- [ ] Message history for new joiners
- [ ] Server-side ping/pong to drop dead connections
- [ ] Angular client using RxJS `webSocket()`

## License

MIT