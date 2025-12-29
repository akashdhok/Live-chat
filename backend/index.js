import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.connect.js";
import messageRoutes from "./routes/message.routes.js";
import { saveMessage } from "./controller/user.controller.js";
import morgan from "morgan";
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(morgan("dev"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // USER JOIN
  socket.on("join_user", (name) => {
    socket.username = name;

    if (!onlineUsers.includes(name)) {
      onlineUsers.push(name);
    }

    console.log("ONLINE USERS:", onlineUsers);

    io.emit("online_users", onlineUsers);
  });

  // TYPING START
  socket.on("typing_start", (name) => {
    socket.broadcast.emit("user_typing", { name, typing: true });
  });

  // TYPING STOP
  socket.on("typing_stop", (name) => {
    socket.broadcast.emit("user_typing", { name, typing: false });
  });

  // SEND MESSAGE
  socket.on("send_message", async (data) => {
    await saveMessage(data);
    io.emit("receive_message", data);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    onlineUsers = onlineUsers.filter(u => u !== socket.username);

    io.emit("online_users", onlineUsers);
  });
});


app.use("/", (req, res) => {
  res.send("API is running....");
});
app.use("/messages", messageRoutes);
const PORT = process.env.PORT || 6067;

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});
