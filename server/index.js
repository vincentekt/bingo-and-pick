const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());

// Simple health check for Azure
app.get('/', (req, res) => {
    res.send('BingoPick Socket Relay is running');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    // 1. Join the room channel
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
    });
    
    // 2. Relay the message to everyone else in the room
    socket.on('relay', (roomId, data) => {
        socket.to(roomId).emit('relay', data);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Socket server listening on port ${PORT}`);
});
