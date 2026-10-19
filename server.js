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
    socket.on('create room', (data) => {
        rooms[data.roomId] = { playlist: [], adminName: data.user }; 
        socket.join(data.roomId);
        socket.roomId = data.roomId;
        socket.isAdmin = true;
        socket.emit('room joined', { success: true, isAdmin: true });
    });

    socket.on('join room', (data) => {
        if (rooms[data.roomId]) {
            socket.join(data.roomId);
            socket.roomId = data.roomId;
            const isUserAdmin = (rooms[data.roomId].adminName === data.user);
            socket.isAdmin = isUserAdmin;
            socket.emit('room joined', { success: true, isAdmin: isUserAdmin });
            socket.emit('playlist update', rooms[data.roomId].playlist);
            socket.to(data.roomId).emit('chat message', { type: 'system', text: `${data.user} joined the room.` });
        } else {
            socket.emit('join error', "Room ID galat hai ya exist nahi karta. Naya room banayein.");
        }
    });

    socket.on('add to playlist', (data) => {
        if(rooms[data.roomId]) {
            rooms[data.roomId].playlist.push(data.song);
            io.to(data.roomId).emit('playlist update', rooms[data.roomId].playlist); 
        }
    });

    socket.on('play specific song', (data) => { socket.to(data.roomId).emit('play specific song', data.song); });
    socket.on('chat message', (data) => { io.to(data.roomId).emit('chat message', data); });
    socket.on('music sync', (data) => { socket.to(data.roomId).emit('music sync', data); });
    socket.on('reaction', (data) => { socket.to(data.roomId).emit('reaction', data.emoji); });
});

// PORT for Live Hosting
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => { console.log(`Soniq Live Server chal raha hai port ${PORT} par`); });
