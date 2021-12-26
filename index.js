const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const http = require('http');
const port = process.env.PORT || 5000;
const ORIGIN = 'https://61c8cbc195163445ceace5c0--objective-snyder-d581ec.netlify.app';
const app = express();
const server = http.createServer(app);
const {addUser,removeUser,getUser,getUsersInRoom,getAllUsers} = require('./users.js');
const io = socketio(server,{
    cors:{
        origin:ORIGIN,
        method:["GET","POST"]
    }
});
const router = require('./router');
io.on("connection",(socket)=>{
    console.log("we have a new connection")
    socket.on('join', ({name,room},callback) =>{
        
        const {error,user} = addUser({id:socket.id,name,room});
        console.log("user :",user);
        
        socket.emit('message',{user: 'admin', text:`${user.name} welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message',{user:'admin', text:`${user.name}, has Joined!`});  
        socket.join(user.room);
        io.to(user.room).emit("roomData",{room:user.room,users:getUsersInRoom(user.room)});
    });
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('message',{user: user.name, text: message})
        callback();
    });

    socket.on("disconnect",() =>{
        console.log("User had left!!");
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',{user: 'admin', text: `${user.name} has left.`});
            io.to(user.room).emit("roomData",{room:user.room,users:getUsersInRoom(user.room)});
        }
    })
});
app.use(router)
app.use(cors());

server.listen(port, () => console.log(`server running... at port ${port}`));