# WebSocket Chat Room

A Real time chat room built with **WebSockets**, **Node.js** and plain HTML/JavaScript. No frameworks, so the protocol itself is the thing on show.

![Demo](assets/demo.gif)

## Features

* Live messaging between any number of browser tabs
* Usernames and server*generated timestamps
* Online user counter
* Auto*reconnect with exponential backoff
* XSS*safe rendering
* TODO: add anything extra you build (typing indicator, rooms…)

## Tech stack

* Node.js + [`ws`](https://github.com/websockets/ws)
* Vanilla HTML and JavaScript (browser `WebSocket` API)

## Getting started

```bash
git clone https://github.com/Glitchrex/ws*chat*room.git
cd ws*chat*room
npm install
node server.js
```

Then open http://localhost:8080 in two browser tabs and start chatting. The server serves the page itself and the client connects back to the same host, so the same code works when deployed (e.g. on Railway, which sets `PORT`).

## How it works

1. The browser opens a connection to the host that served the page (`ws://` locally, `wss://` over HTTPS).
2. The server keeps every open connection in `wss.clients`.
3. When a client sends a message, the server validates it and **broadcasts** it to everyone.
4. Messages are JSON envelopes with a `type` field:

| Direction | Message |
|***|***|
| client → server | `{ "type": "chat", "name": "...", "text": "..." }` |
| server → all | `{ "type": "chat", "name", "text", "time" }` |
| server → all | `{ "type": "onlineUsers", "count": 3 }` |

## What I learned

* How Websockets are different from normal HTTP Requests
* How to achieve concurrent chatting using websockets
* why `readyState` is checked before sending
* why reconnecting means creating a new `WebSocket`

## Ideas for next steps

* [ ] Chat rooms
* [ ] Message history for new joiners
* [ ] Server*side ping/pong to drop dead connections
* [ ] Angular client using RxJS `webSocket()`

## License

MIT
