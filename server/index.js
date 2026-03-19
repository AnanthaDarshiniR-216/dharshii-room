const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ─── In-memory rooms ───────────────────────────────────────────────
const rooms = {};

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── REST endpoints ───────────────────────────────────────────────

// Create a new room
app.post("/create-room", (req, res) => {
  const { password = "", hostName = "Host" } = req.body;

  let roomCode;
  do { roomCode = generateRoomCode(); } while (rooms[roomCode]);

  rooms[roomCode] = {
    password,
    hostName,
    users: [],
    messages: [],
    typingUsers: new Set(),
    createdAt: Date.now()
  };

  res.json({ roomCode });
});

// Check room + validate password
app.post("/check-room", (req, res) => {
  const { roomCode, password = "" } = req.body;
  const room = rooms[roomCode?.toUpperCase()];

  if (!room) return res.json({ exists: false, message: "Room not found" });
  if (room.password && room.password !== password)
    return res.json({ exists: true, passwordValid: false, message: "Wrong password" });

  return res.json({ exists: true, passwordValid: true, hostName: room.hostName });
});

// Health check
app.get("/", (req, res) => res.send("Dharshii Room Server is running 💜"));

// ─── Socket.IO ───────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ roomCode, username, password = "" }) => {
    const code = roomCode?.toUpperCase();
    const room = rooms[code];

    if (!room) { socket.emit("room_error", "Room does not exist"); return; }
    if (room.password && room.password !== password) {
      socket.emit("room_error", "Invalid room password"); return;
    }

    socket.join(code);
    socket.roomCode = code;
    socket.username = username;

    if (!room.users.includes(username)) room.users.push(username);

    socket.emit("previous_messages", room.messages);

    const systemMsg = {
      username: "System",
      message: `${username} joined the room`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    room.messages.push(systemMsg);

    io.to(code).emit("receive_message", systemMsg);
    io.to(code).emit("room_users", room.users);
    io.to(code).emit("typing_users", Array.from(room.typingUsers));
  });

  socket.on("send_message", ({ roomCode, username, message }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const msgData = {
      username,
      message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    room.messages.push(msgData);
    room.typingUsers.delete(username);

    io.to(roomCode).emit("typing_users", Array.from(room.typingUsers));
    io.to(roomCode).emit("receive_message", msgData);
  });

  socket.on("typing", ({ roomCode, username }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.typingUsers.add(username);
    io.to(roomCode).emit("typing_users", Array.from(room.typingUsers));
  });

  socket.on("stop_typing", ({ roomCode, username }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.typingUsers.delete(username);
    io.to(roomCode).emit("typing_users", Array.from(room.typingUsers));
  });

  socket.on("disconnect", () => {
    const roomCode = socket.roomCode;
    const username = socket.username;

    if (roomCode && rooms[roomCode]) {
      const room = rooms[roomCode];
      room.users = room.users.filter((u) => u !== username);
      room.typingUsers.delete(username);

      const systemMsg = {
        username: "System",
        message: `${username} left the room`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      room.messages.push(systemMsg);

      io.to(roomCode).emit("receive_message", systemMsg);
      io.to(roomCode).emit("room_users", room.users);
      io.to(roomCode).emit("typing_users", Array.from(room.typingUsers));

      if (room.users.length === 0) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted (empty)`);
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 💜`));
