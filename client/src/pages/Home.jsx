import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const navigate = useNavigate();

  // Create room
  const [hostName, setHostName]       = useState("");
  const [roomPass, setRoomPass]       = useState("");
  const [creating, setCreating]       = useState(false);

  // Join room
  const [joinName, setJoinName]       = useState("");
  const [joinCode, setJoinCode]       = useState("");
  const [joinPass, setJoinPass]       = useState("");
  const [joining,  setJoining]        = useState(false);
  const [joinError, setJoinError]     = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // ── Create Room ──────────────────────────────────────────────
  const createRoom = async () => {
    if (!hostName.trim()) return showToast("Enter your name first 👀");
    if (!roomPass.trim()) return showToast("Set a room password 🔐");
    setCreating(true);
    try {
      const res  = await fetch(`${API}/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: roomPass.trim(), hostName: hostName.trim() })
      });
      const data = await res.json();
      localStorage.setItem("username", hostName.trim());
      localStorage.setItem("roomPassword", roomPass.trim());
      navigate(`/room/${data.roomCode}`);
    } catch {
      showToast("Failed to create room 😢 Is the server running?");
    }
    setCreating(false);
  };

  // ── Join Room ────────────────────────────────────────────────
  const joinRoom = async () => {
    if (!joinName.trim()) return setJoinError("Enter your name 👀");
    if (!joinCode.trim()) return setJoinError("Enter the room code 🔑");
    if (!joinPass.trim()) return setJoinError("Enter the room password 🔐");
    setJoining(true); setJoinError("");
    try {
      const res  = await fetch(`${API}/check-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: joinCode.trim().toUpperCase(), password: joinPass.trim() })
      });
      const data = await res.json();
      if (!data.exists)        { setJoinError("Room not found 🔍"); setJoining(false); return; }
      if (!data.passwordValid) { setJoinError("Wrong password! Ask the host 🔐"); setJoining(false); return; }

      localStorage.setItem("username", joinName.trim());
      localStorage.setItem("roomPassword", joinPass.trim());
      navigate(`/room/${joinCode.trim().toUpperCase()}`);
    } catch {
      setJoinError("Could not connect. Try again 😢");
    }
    setJoining(false);
  };

  return (
    <>
      <div className="bg-wrap">
        <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
      </div>
      <div className="noise"/>
      {toast && <div className="toast">{toast}</div>}

      <div className="page">
        <div className="card">
          {/* Brand */}
          <div className="brand-row">
            <div className="brand-avatar">👑</div>
            <div>
              <div className="brand-name">Dharshii's Room</div>
              <div className="brand-sub">Private space • Password protected 🔐</div>
            </div>
          </div>

          {/* ── Create Room ── */}
          <label className="field-label">YOUR NAME</label>
          <input className="glass-input" placeholder="Enter your name..."
            value={hostName} onChange={e => setHostName(e.target.value)}/>

          <label className="field-label">SET ROOM PASSWORD</label>
          <input className="glass-input" type="password"
            placeholder="Create a password for your room..."
            value={roomPass} onChange={e => setRoomPass(e.target.value)}/>

          <button className="btn-primary" onClick={createRoom} disabled={creating}>
            {creating ? "Creating..." : "✦ Create My Room"}
          </button>

          {/* ── Divider ── */}
          <div className="divider"><span>or join existing room</span></div>

          {/* ── Join Room ── */}
          <label className="field-label">YOUR NAME</label>
          <input className="glass-input" placeholder="Enter your name..."
            value={joinName} onChange={e => setJoinName(e.target.value)}/>

          <label className="field-label">ROOM CODE</label>
          <input className="glass-input" placeholder="e.g. AB12XY"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
            maxLength={6}/>

          <label className="field-label">ROOM PASSWORD</label>
          <input className="glass-input" type="password"
            placeholder="Enter the password..."
            value={joinPass}
            onChange={e => { setJoinPass(e.target.value); setJoinError(""); }}
            onKeyDown={e => e.key === "Enter" && joinRoom()}/>

          {joinError && <div className="error-msg">{joinError}</div>}

          <button className="btn-outline" onClick={joinRoom} disabled={joining}>
            {joining ? "Joining..." : "🔗 Join Room"}
          </button>
        </div>
      </div>
    </>
  );
}
