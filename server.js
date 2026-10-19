const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// Memory Database (Live hosting ke liye)
const rooms = {}; 

io.on('connection', (socket) => {
    socket.on('join room', (data) => {
        socket.join(data.roomId);
        socket.roomId = data.roomId;
        socket.isAdmin = data.isAdmin;

        // Agar room nahi hai, toh naya banao
        if (!rooms[data.roomId]) { rooms[data.roomId] = []; }
        
        // Playlist user ko bhejo
        socket.emit('playlist update', rooms[data.roomId]);
        
        socket.to(data.roomId).emit('chat message', { type: 'system', text: `${data.user} joined the room.` });
    });

    socket.on('add to playlist', (data) => {
        if(rooms[data.roomId]) {
            rooms[data.roomId].push(data.song);
            io.to(data.roomId).emit('playlist update', rooms[data.roomId]); 
        }
    });

    socket.on('play specific song', (data) => {
        socket.to(data.roomId).emit('play specific song', data.song);
    });

    socket.on('chat message', (data) => { io.to(data.roomId).emit('chat message', data); });
    socket.on('music sync', (data) => { socket.to(data.roomId).emit('music sync', data); });
    socket.on('reaction', (data) => { socket.to(data.roomId).emit('reaction', data.emoji); });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => { console.log(`Soniq Live Server chal raha hai port ${PORT} par`); });
