import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(API);

export default function ChatRoom() {
  const { roomCode } = useParams();
  const navigate     = useNavigate();
  const username     = localStorage.getItem("username");
  const roomPassword = localStorage.getItem("roomPassword") || "";

  const [message,      setMessage]      = useState("");
  const [chat,         setChat]         = useState([]);
  const [users,        setUsers]        = useState([]);
  const [typingUsers,  setTypingUsers]  = useState([]);
  const [toast,        setToast]        = useState(null);

  const typingTimeout = useRef(null);
  const bottomRef     = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  useEffect(() => {
    if (!username) { navigate("/"); return; }

    socket.emit("join_room", { roomCode, username, password: roomPassword });

    socket.on("previous_messages", (msgs) => setChat(msgs));
    socket.on("receive_message",   (msg)  => setChat(prev => [...prev, msg]));
    socket.on("room_users",        (list) => setUsers(list));
    socket.on("typing_users",      (list) => setTypingUsers(list.filter(u => u !== username)));
    socket.on("room_error",        (msg)  => { alert(msg); navigate("/"); });

    return () => {
      socket.off("previous_messages");
      socket.off("receive_message");
      socket.off("room_users");
      socket.off("typing_users");
      socket.off("room_error");
    };
  }, [roomCode, username, roomPassword, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, typingUsers]);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send_message", { roomCode, username, message: message.trim() });
    setMessage("");
    socket.emit("stop_typing", { roomCode, username });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { roomCode, username });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { roomCode, username });
    }, 1200);
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    showToast("Room code copied! 📋");
  };

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/room/${roomCode}`;
    await navigator.clipboard.writeText(link);
    showToast("Invite link copied! Share it with your friends 🔗");
  };

  const leaveRoom = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("roomPassword");
    window.location.href = "/";
  };

  // Determine if a user is the host (first user or matches host pattern)
  const isHost = (name) => name === localStorage.getItem("hostName") || users[0] === name;

  return (
    <>
      <div className="bg-wrap">
        <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
      </div>
      <div className="noise"/>
      {toast && <div className="toast">{toast}</div>}

      <div className="chat-page">
        <div className="chat-wrap">

          {/* ── Topbar ── */}
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-avatar">👑</div>
              <div>
                <div className="topbar-title">Dharshii's Room</div>
                <div className="topbar-sub">Private • Password protected 🔐</div>
              </div>
            </div>
            <div className="topbar-actions">
              <button className="btn-sm btn-ghost" onClick={copyRoomCode}>Copy Code</button>
              <button className="btn-sm btn-ghost" onClick={copyInviteLink}>Copy Link</button>
              <button className="btn-sm btn-danger-sm" onClick={leaveRoom}>Leave</button>
            </div>
          </div>

          {/* ── Room code + online bar ── */}
          <div className="meta-bar">
            <div className="online-pill">
              <span className="pulse-dot"/>
              {users.length} online &nbsp;·&nbsp;
              <span style={{ color: "#c8a8ff", fontFamily: "'Syne', sans-serif", letterSpacing: "1px" }}>
                {roomCode}
              </span>
            </div>
            <div className="user-chips">
              {users.map(u => (
                <span key={u}
                  className={`chip ${u === username ? "me-chip" : u === users[0] ? "host-chip" : ""}`}>
                  {u === users[0] ? "👑 " : ""}{u}
                </span>
              ))}
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="chat-box">
            {chat.map((msg, i) => (
              <div key={i}
                className={`bubble ${
                  msg.username === "System"   ? "bubble-system" :
                  msg.username === username   ? "bubble-mine"   : "bubble-other"
                }`}>
                {msg.username !== "System" && (
                  <div className="bubble-head">
                    <span className={`bubble-name ${
                      msg.username === users[0] ? "host-n" :
                      msg.username === username ? "mine-n" : ""
                    }`}>
                      {msg.username === users[0] ? "👑 " : ""}{msg.username}
                    </span>
                    <span className="bubble-time">{msg.time}</span>
                  </div>
                )}
                <div className="bubble-text">{msg.message}</div>
              </div>
            ))}

            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                ✦ {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* ── Input ── */}
          <div className="input-row">
            <input
              className="chat-input"
              placeholder="Say something… 💜"
              value={message}
              onChange={handleTyping}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage}>Send 💜</button>
          </div>

        </div>
      </div>
    </>
  );
}
