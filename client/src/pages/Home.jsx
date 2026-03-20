import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const navigate = useNavigate();

  // If friend arrived via invite link (?code=XXXXXX), send them to join page
  const urlCode =
    new URLSearchParams(window.location.search).get("code")?.toUpperCase() ||
    "";
  if (urlCode) {
    // Redirect to join flow with code
    window.history.replaceState({}, "", `/?join=${urlCode}`);
  }
  const joinCode =
    new URLSearchParams(window.location.search).get("join")?.toUpperCase() ||
    "";

  const [hostName, setHostName] = useState("");
  const [roomPass, setRoomPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  // Join states — only used if arrived via link
  const [joinName, setJoinName] = useState("");
  const [joinPass, setJoinPass] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // Create Room
  const createRoom = async () => {
    if (!hostName.trim()) return showToast("Enter your name first 👀");
    if (!roomPass.trim()) return showToast("Set a room password 🔐");
    setCreating(true);
    try {
      const res = await fetch(`${API}/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: roomPass.trim(),
          hostName: hostName.trim(),
        }),
      });
      const data = await res.json();
      localStorage.setItem("username", hostName.trim());
      localStorage.setItem("roomPassword", roomPass.trim());
      sessionStorage.setItem(`gate_${data.roomCode}`, "true");
      navigate(`/room/${data.roomCode}`);
    } catch {
      showToast("Failed to create room 😢 Is the server running?");
    }
    setCreating(false);
  };

  // Join Room (only for friends via invite link)
  const joinRoom = async () => {
    if (!joinName.trim()) return setJoinError("Enter your name 👀");
    if (!joinPass.trim()) return setJoinError("Enter the password 🔐");
    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch(`${API}/check-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: joinCode, password: joinPass.trim() }),
      });
      const data = await res.json();
      if (!data.exists) {
        setJoinError("Room not found 🔍");
        setJoining(false);
        return;
      }
      if (!data.passwordValid) {
        setJoinError("Wrong password! Ask Dharshii 🔐");
        setJoining(false);
        return;
      }
      localStorage.setItem("username", joinName.trim());
      localStorage.setItem("roomPassword", joinPass.trim());
      sessionStorage.setItem(`gate_${joinCode}`, "true");
      navigate(`/room/${joinCode}`);
    } catch {
      setJoinError("Could not connect. Try again 😢");
    }
    setJoining(false);
  };

  return (
    <>
      <div className="bg-wrap">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>
      <div className="noise" />
      {toast && <div className="toast">{toast}</div>}

      <div className="page">
        <div className="card">
          {/* Brand */}
          <div className="brand-row">
            <div className="brand-avatar">👑</div>
            <div>
              <div className="brand-name">Dharshii's Room</div>
              <div className="brand-sub">
                Private space • Password protected 🔐
              </div>
            </div>
          </div>

          {/* ── FRIEND VIEW: arrived via invite link ── */}
          {joinCode ? (
            <>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 14,
                  marginBottom: 20,
                  background: "rgba(155,79,255,0.08)",
                  border: "1px solid rgba(180,100,255,0.2)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#8060b0",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  You've been invited!
                </div>
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#d4a4ff",
                    letterSpacing: 3,
                  }}
                >
                  {joinCode}
                </div>
                <div style={{ color: "#8060b0", fontSize: 12, marginTop: 4 }}>
                  Enter your name and password to join 💜
                </div>
              </div>

              <label className="field-label">YOUR NAME</label>
              <input
                className="glass-input"
                placeholder="Enter your name..."
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                autoFocus
              />

              <label className="field-label">ROOM PASSWORD</label>
              <input
                className="glass-input"
                type="password"
                placeholder="Enter the password Dharshii shared..."
                value={joinPass}
                onChange={(e) => {
                  setJoinPass(e.target.value);
                  setJoinError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              />

              {joinError && <div className="error-msg">{joinError}</div>}

              <button
                className="btn-primary"
                onClick={joinRoom}
                disabled={joining}
              >
                {joining ? "Joining..." : "🔗 Join Room"}
              </button>
            </>
          ) : (
            /* ── DHARSHII VIEW: create room only ── */
            <>
              <label className="field-label">YOUR NAME</label>
              <input
                className="glass-input"
                placeholder="Enter your name..."
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
              />

              <label className="field-label">SET ROOM PASSWORD</label>
              <input
                className="glass-input"
                type="password"
                placeholder="Create a password for your room..."
                value={roomPass}
                onChange={(e) => setRoomPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createRoom()}
              />

              <button
                className="btn-primary"
                onClick={createRoom}
                disabled={creating}
              >
                {creating ? "Creating..." : "✦ Create My Room"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
