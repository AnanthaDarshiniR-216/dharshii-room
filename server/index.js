const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  maxHttpBufferSize: 20 * 1024 * 1024
});

const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getISTTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
    hour12: true, timeZone: "Asia/Kolkata"
  });
}

app.post("/create-room", (req, res) => {
  const { password = "", hostName = "Host" } = req.body;
  let roomCode;
  do { roomCode = generateRoomCode(); } while (rooms[roomCode]);
  rooms[roomCode] = {
    password, hostName,
    users: [], messages: [],
    typingUsers: new Set(),
    seenBy: {},
    createdAt: Date.now()
  };
  res.json({ roomCode });
});

app.post("/check-room", (req, res) => {
  const { roomCode, password = "" } = req.body;
  const room = rooms[roomCode?.toUpperCase()];
  if (!room) return res.json({ exists: false, message: "Room not found" });
  if (room.password && room.password !== password)
    return res.json({ exists: true, passwordValid: false, message: "Wrong password" });
  return res.json({ exists: true, passwordValid: true, hostName: room.hostName });
});

app.get("/", (req, res) => res.send("Dharshii Room Server 💜"));

io.on("connection", (socket) => {
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
      id: Date.now() + Math.random(),
      username: "System",
      message: `${username} joined`,
      time: getISTTime(),
      type: "system"
    };
    room.messages.push(systemMsg);
    io.to(code).emit("receive_message", systemMsg);
    io.to(code).emit("room_users", room.users);
    io.to(code).emit("typing_users", Array.from(room.typingUsers));

    // Mark all existing messages as seen for this user
    io.to(code).emit("seen_update", { seenBy: room.users });
  });

  // Send text message
  socket.on("send_message", ({ roomCode, username, message, replyTo = null }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const msgData = {
      id: Date.now() + Math.random(),
      username, message,
      time: getISTTime(),
      type: "text",
      replyTo,
      reactions: {},
      edited: false,
      deleted: false,
      seenBy: [username]
    };
    room.messages.push(msgData);
    room.typingUsers.delete(username);
    io.to(roomCode).emit("typing_users", Array.from(room.typingUsers));
    io.to(roomCode).emit("receive_message", msgData);
  });

  // Send file/image
  socket.on("send_file", ({ roomCode, username, fileName, fileType, fileData, replyTo = null }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const msgData = {
      id: Date.now() + Math.random(),
      username, fileName, fileType, fileData,
      time: getISTTime(),
      type: fileType?.startsWith("image/") ? "image" : "file",
      replyTo,
      reactions: {},
      edited: false,
      deleted: false,
      seenBy: [username]
    };
    room.messages.push(msgData);
    io.to(roomCode).emit("receive_message", msgData);
  });

  // Mark messages as seen
  socket.on("mark_seen", ({ roomCode, username }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.messages.forEach(msg => {
      if (msg.seenBy && !msg.seenBy.includes(username)) {
        msg.seenBy.push(username);
      }
    });
    io.to(roomCode).emit("seen_update", {
      seenBy: room.users,
      messages: room.messages.map(m => ({ id: m.id, seenBy: m.seenBy }))
    });
  });

  // React to message
  socket.on("react_message", ({ roomCode, msgId, username, emoji }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const msg = room.messages.find(m => m.id === msgId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(username);
    if (idx === -1) {
      // Remove user from any other reaction first
      Object.keys(msg.reactions).forEach(e => {
        msg.reactions[e] = msg.reactions[e].filter(u => u !== username);
      });
      msg.reactions[emoji].push(username);
    } else {
      msg.reactions[emoji].splice(idx, 1);
    }
    io.to(roomCode).emit("message_updated", msg);
  });

  // Edit message
  socket.on("edit_message", ({ roomCode, msgId, username, newText }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const msg = room.messages.find(m => m.id === msgId);
    if (!msg || msg.username !== username) return;
    msg.message = newText;
    msg.edited = true;
    io.to(roomCode).emit("message_updated", msg);
  });

  // Delete message
  socket.on("delete_message", ({ roomCode, msgId, username }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const msg = room.messages.find(m => m.id === msgId);
    if (!msg || msg.username !== username) return;
    msg.deleted = true;
    msg.message = "This message was deleted";
    io.to(roomCode).emit("message_updated", msg);
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
    const { roomCode, username } = socket;
    if (roomCode && rooms[roomCode]) {
      const room = rooms[roomCode];
      room.users = room.users.filter(u => u !== username);
      room.typingUsers.delete(username);
      const systemMsg = {
        id: Date.now(), username: "System",
        message: `${username} left`, time: getISTTime(), type: "system"
      };
      room.messages.push(systemMsg);
      io.to(roomCode).emit("receive_message", systemMsg);
      io.to(roomCode).emit("room_users", room.users);
      if (room.users.length === 0) { delete rooms[roomCode]; }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 💜`));
