## The Problem with HTTP

HTTP is stateless and request-driven. The client asks, the server answers, and the connection closes. For real-time apps — chat, live data, games — this is painfully inefficient.

## The WebSocket Handshake

WebSockets start as an HTTP request with an `Upgrade: websocket` header. If the server agrees, it responds with a 101 Switching Protocols and the connection upgrades to a persistent, full-duplex channel.

```
GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZQ==
```

## Frames, not Packets

WebSocket data is sent in *frames*. Each frame has an opcode (text, binary, ping, pong, close), a masking key (client→server), and the payload.

## Building a Simple Server

In Node.js, the `ws` library handles all the framing for you. A minimal echo server is under 10 lines of code.

## When to Use Them

Use WebSockets for chat, collaborative editing, live dashboards, multiplayer games. For simple notifications, Server-Sent Events may be simpler. For REST data, stick to HTTP.
