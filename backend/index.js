import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.connect.js';
import messageRoutes from './routes/message.routes.js';
import { saveMessage } from './controller/user.controller.js';
import morgan from 'morgan';
const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(cors({
    origin : true,
    credentials : true,
    allowedHeaders : ['Content-Type', 'Authorization'],
    methods : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))
app.use(morgan('dev'));

const server = http.createServer(app);

const io = new Server(server , {
    cors:{
        origin : true,
        methods : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", async (data) => {
    await saveMessage(data);    
    io.emit("receive_message", data); 
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use("/" , (req , res)=>{
    res.send("API is running....")
})
app.use("/messages", messageRoutes);
const PORT = process.env.PORT || 6067;

server.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
});         




