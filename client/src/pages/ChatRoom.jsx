import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(API);

const EMOJI_LIST = ["❤️","😂","😮","😢","😡","👍"];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .chat-page *{margin:0;padding:0;box-sizing:border-box;}
  .chat-page{
    font-family:'Plus Jakarta Sans',sans-serif;
    background:#000;color:#e0ffe0;
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    padding:14px;position:relative;overflow:hidden;
  }

  /* neon bg */
  .chat-page::before{
    content:'';position:fixed;inset:0;z-index:0;
    background:radial-gradient(ellipse at 20% 0%,#001a00 0%,#000 60%);
  }
  .gnoise{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0.015;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
  .gorb{position:fixed;border-radius:50%;filter:blur(110px);opacity:0.1;pointer-events:none;animation:gdrift 20s ease-in-out infinite alternate;}
  .go1{width:380px;height:380px;background:#00ff44;top:-100px;left:-80px;}
  .go2{width:300px;height:300px;background:#00cc33;bottom:-80px;right:-60px;animation-delay:-8s;}
  .go3{width:200px;height:200px;background:#004400;top:45%;left:22%;animation-delay:-14s;}
  @keyframes gdrift{from{transform:translate(0,0) scale(1)}to{transform:translate(28px,18px) scale(1.05)}}
  @keyframes gfadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

  .chat-wrap{
    position:relative;z-index:2;
    width:100%;max-width:920px;height:calc(100vh - 28px);
    background:rgba(0,8,0,0.96);
    border:1px solid rgba(0,255,68,0.18);
    border-radius:24px;backdrop-filter:blur(24px);
    display:flex;flex-direction:column;overflow:hidden;
    box-shadow:0 0 60px rgba(0,255,68,0.07),inset 0 1px 0 rgba(0,255,68,0.05);
    animation:gfadeUp .4s ease;
  }

  /* topbar */
  .g-topbar{
    display:flex;justify-content:space-between;align-items:center;
    padding:12px 18px;border-bottom:1px solid rgba(0,255,68,0.12);
    background:rgba(0,0,0,0.5);flex-shrink:0;gap:12px;
  }
  .g-top-left{display:flex;align-items:center;gap:12px;}
  .g-top-dp{
    width:42px;height:42px;border-radius:50%;overflow:hidden;flex-shrink:0;
    border:2px solid rgba(0,255,68,0.4);
    box-shadow:0 0 14px rgba(0,255,68,0.25);
  }
  .g-top-dp img{width:100%;height:100%;object-fit:cover;}
  .g-top-title{
    font-family:'Syne',sans-serif;font-size:19px;font-weight:800;
    color:#00ff44;text-shadow:0 0 14px rgba(0,255,68,0.5);
  }
  .g-top-sub{color:#3a7a3a;font-size:11px;margin-top:1px;}
  .g-top-btns{display:flex;gap:7px;flex-wrap:wrap;}
  .g-btn-sm{
    padding:8px 12px;border-radius:10px;font-size:12px;font-weight:600;
    font-family:inherit;cursor:pointer;transition:.18s;border:none;
  }
  .g-btn-ghost{
    background:rgba(0,255,68,0.06);color:#00ff44;
    border:1px solid rgba(0,255,68,0.15);
  }
  .g-btn-ghost:hover{background:rgba(0,255,68,0.14);transform:translateY(-1px);}
  .g-btn-danger{
    background:rgba(255,50,50,0.07);color:#ff6060;
    border:1px solid rgba(255,50,50,0.15);
  }
  .g-btn-danger:hover{background:rgba(255,50,50,0.15);}

  /* meta */
  .g-meta{
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:8px 18px;border-bottom:1px solid rgba(0,255,68,0.08);
    background:rgba(0,0,0,0.3);flex-shrink:0;
  }
  .g-online{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#00cc33;}
  .g-dot{
    width:8px;height:8px;border-radius:50%;background:#00ff44;
    box-shadow:0 0 8px #00ff44;animation:gpulse 2s ease-in-out infinite;
  }
  @keyframes gpulse{0%,100%{box-shadow:0 0 6px #00ff44}50%{box-shadow:0 0 14px #00ff44}}
  .g-chips{display:flex;gap:5px;flex-wrap:wrap;}
  .g-chip{
    padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;
    background:rgba(0,255,68,0.07);color:#00cc33;
    border:1px solid rgba(0,255,68,0.12);
  }
  .g-chip.me{background:rgba(0,200,255,0.07);color:#00ccff;border-color:rgba(0,200,255,0.14);}

  /* messages */
  .g-messages{
    flex:1;overflow-y:auto;padding:14px 14px 6px;
    display:flex;flex-direction:column;gap:2px;
  }
  .g-messages::-webkit-scrollbar{width:4px;}
  .g-messages::-webkit-scrollbar-thumb{background:rgba(0,255,68,0.12);border-radius:20px;}

  /* reply preview in message */
  .reply-preview{
    background:rgba(0,255,68,0.05);border-left:2px solid #00ff44;
    padding:5px 10px;border-radius:6px;margin-bottom:5px;
    font-size:11px;color:#3a7a3a;
  }
  .reply-preview span{color:#00cc33;font-weight:600;}

  /* bubble */
  .g-bubble{
    max-width:65%;padding:8px 12px;border-radius:16px;
    word-break:break-word;position:relative;
    animation:gpop .2s cubic-bezier(.22,.68,0,1.2);
    margin-bottom:4px;
  }
  @keyframes gpop{from{opacity:0;transform:scale(.94) translateY(5px)}to{opacity:1;transform:none}}
  .g-bubble.other{
    background:rgba(0,40,0,0.9);
    border:1px solid rgba(0,255,68,0.1);
    border-bottom-left-radius:4px;
  }
  .g-bubble.mine{
    background:rgba(0,60,10,0.95);
    border:1px solid rgba(0,255,68,0.18);
    margin-left:auto;
    border-bottom-right-radius:4px;
    box-shadow:0 0 10px rgba(0,255,68,0.05);
  }
  .g-bubble.deleted{
    opacity:0.5;font-style:italic;
    background:rgba(0,0,0,0.4)!important;
    border-color:rgba(255,255,255,0.05)!important;
  }
  .g-bubble.system-b{
    max-width:100%;text-align:center;margin:4px auto;
    background:transparent;color:#1a4a1a;font-size:11px;
    border:none;padding:3px 10px;
  }

  .g-bhead{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:3px;}
  .g-bname{font-size:11px;font-weight:700;color:#00ff44;}
  .g-bname.mn{color:#00ccff;}
  .g-btime{font-size:10px;color:#1a4a1a;display:flex;align-items:center;gap:3px;}
  .g-ticks{font-size:12px;color:#1a6a1a;}
  .g-ticks.seen{color:#00ccff;}
  .g-btext{font-size:14px;line-height:1.5;color:#c0ffc0;}
  .g-edited{font-size:10px;color:#1a6a1a;margin-left:4px;}

  /* image msg */
  .g-img-msg{max-width:220px;border-radius:10px;overflow:hidden;cursor:pointer;}
  .g-img-msg img{width:100%;display:block;border-radius:10px;}
  .g-file-msg{
    display:flex;align-items:center;gap:8px;padding:6px 10px;
    background:rgba(0,255,68,0.06);border-radius:10px;cursor:pointer;
    border:1px solid rgba(0,255,68,0.12);text-decoration:none;
  }
  .g-file-icon{font-size:20px;}
  .g-file-name{font-size:12px;color:#00cc33;word-break:break-all;}

  /* reactions */
  .g-reactions{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;}
  .g-reaction{
    font-size:12px;padding:1px 6px;border-radius:10px;cursor:pointer;
    background:rgba(0,255,68,0.06);border:1px solid rgba(0,255,68,0.1);
    transition:.15s;
  }
  .g-reaction:hover{background:rgba(0,255,68,0.14);}
  .g-reaction.mine-r{background:rgba(0,255,68,0.15);border-color:rgba(0,255,68,0.3);}

  /* hover actions */
  .g-bubble-wrap{position:relative;display:flex;flex-direction:column;}
  .g-bubble-wrap.mine-w{align-items:flex-end;}
  .g-actions{
    display:none;position:absolute;top:-28px;
    background:rgba(0,10,0,0.95);border:1px solid rgba(0,255,68,0.2);
    border-radius:10px;padding:3px 4px;gap:2px;z-index:10;
    flex-direction:row;white-space:nowrap;
  }
  .g-bubble-wrap:hover .g-actions{display:flex;}
  .g-bubble-wrap.mine-w .g-actions{right:0;}
  .g-bubble-wrap.other-w .g-actions{left:0;}
  .g-action-btn{
    background:none;border:none;cursor:pointer;font-size:14px;
    padding:3px 5px;border-radius:6px;transition:.15s;color:#00cc33;
  }
  .g-action-btn:hover{background:rgba(0,255,68,0.12);}

  /* emoji picker */
  .emoji-picker{
    display:flex;gap:4px;padding:4px 6px;
    background:rgba(0,10,0,0.98);border:1px solid rgba(0,255,68,0.2);
    border-radius:20px;
  }
  .emoji-btn{font-size:16px;cursor:pointer;padding:2px 4px;border-radius:6px;transition:.15s;border:none;background:none;}
  .emoji-btn:hover{background:rgba(0,255,68,0.12);transform:scale(1.2);}

  /* reply bar */
  .g-reply-bar{
    display:flex;align-items:center;justify-content:space-between;
    padding:8px 14px;background:rgba(0,30,0,0.8);
    border-top:1px solid rgba(0,255,68,0.1);flex-shrink:0;
  }
  .g-reply-info{font-size:12px;color:#3a7a3a;}
  .g-reply-info span{color:#00cc33;font-weight:600;}
  .g-reply-cancel{background:none;border:none;color:#3a7a3a;cursor:pointer;font-size:16px;}

  /* typing */
  .g-typing{font-size:12px;color:#1a6a1a;padding:3px 6px;animation:gfadeUp .3s ease;}

  /* input */
  .g-input-row{
    display:flex;gap:8px;padding:12px 14px;
    border-top:1px solid rgba(0,255,68,0.1);
    background:rgba(0,0,0,0.4);flex-shrink:0;align-items:flex-end;
  }
  .g-attach-btn{
    padding:12px;border-radius:12px;border:none;cursor:pointer;
    background:rgba(0,255,68,0.06);color:#00cc33;
    border:1px solid rgba(0,255,68,0.12);font-size:16px;
    transition:.18s;flex-shrink:0;
  }
  .g-attach-btn:hover{background:rgba(0,255,68,0.14);}
  .g-chat-inp{
    flex:1;padding:12px 14px;border-radius:13px;
    border:1px solid rgba(0,255,68,0.12);
    background:rgba(0,15,0,0.8);
    color:#c0ffc0;outline:none;font-size:14px;font-family:inherit;
    transition:.2s;resize:none;min-height:44px;max-height:120px;
  }
  .g-chat-inp:focus{border-color:rgba(0,255,68,0.35);box-shadow:0 0 0 3px rgba(0,255,68,0.05);}
  .g-chat-inp::placeholder{color:#1a4a1a;}
  .g-send-btn{
    padding:12px 20px;border-radius:13px;border:none;
    background:linear-gradient(135deg,#00cc33,#009922);
    color:#000;font-weight:700;font-size:14px;font-family:inherit;
    cursor:pointer;transition:.18s;flex-shrink:0;
    box-shadow:0 4px 14px rgba(0,255,68,0.2);
  }
  .g-send-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,255,68,0.3);}

  /* edit input */
  .g-edit-input{
    width:100%;background:rgba(0,20,0,0.9);border:1px solid rgba(0,255,68,0.3);
    color:#c0ffc0;border-radius:8px;padding:6px 10px;font-size:14px;
    font-family:inherit;outline:none;
  }
  .g-edit-actions{display:flex;gap:6px;margin-top:5px;}
  .g-edit-save{
    padding:4px 12px;border-radius:7px;border:none;cursor:pointer;
    background:#00cc33;color:#000;font-size:12px;font-weight:700;font-family:inherit;
  }
  .g-edit-cancel{
    padding:4px 12px;border-radius:7px;border:none;cursor:pointer;
    background:rgba(255,255,255,0.06);color:#888;font-size:12px;font-family:inherit;
  }

  /* image modal */
  .img-modal{
    position:fixed;inset:0;z-index:999;background:rgba(0,0,0,0.92);
    display:flex;align-items:center;justify-content:center;cursor:pointer;
  }
  .img-modal img{max-width:90vw;max-height:90vh;border-radius:12px;}

  /* toast */
  .g-toast{
    position:fixed;top:14px;right:14px;z-index:9999;
    background:#001a00;border:1px solid rgba(0,255,68,0.3);
    color:#00ff44;padding:10px 16px;border-radius:12px;
    font-size:13px;font-weight:600;
    animation:gfadeUp .3s ease;box-shadow:0 8px 28px rgba(0,0,0,0.5);
  }

  @media(max-width:640px){
    .g-topbar{flex-direction:column;align-items:flex-start;gap:10px;}
    .g-top-btns{width:100%;}
    .g-btn-sm{flex:1;text-align:center;}
    .g-meta{flex-direction:column;align-items:flex-start;}
    .g-input-row{flex-direction:column;}
    .g-send-btn{width:100%;padding:13px;}
    .g-bubble{max-width:88%;}
  }
`;

export default function ChatRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const roomPassword = localStorage.getItem("roomPassword") || "";

  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [toast, setToast] = useState(null);
  const [imgModal, setImgModal] = useState(null);
  const [showEmoji, setShowEmoji] = useState(null); // msgId

  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 2200); };

  useEffect(() => {
    if (!username) { navigate("/"); return; }

    socket.emit("join_room", { roomCode, username, password: roomPassword });

    socket.on("previous_messages", (msgs) => setChat(msgs));
    socket.on("receive_message", (msg) => {
      setChat(prev => [...prev, msg]);
      socket.emit("mark_seen", { roomCode, username });
    });
    socket.on("room_users", (list) => setUsers(list));
    socket.on("typing_users", (list) => setTypingUsers(list.filter(u => u !== username)));
    socket.on("room_error", (msg) => { alert(msg); navigate("/"); });
    socket.on("message_updated", (updated) => {
      setChat(prev => prev.map(m => m.id === updated.id ? updated : m));
    });
    socket.on("seen_update", ({ messages: updatedMsgs }) => {
      if (!updatedMsgs) return;
      setChat(prev => prev.map(m => {
        const upd = updatedMsgs.find(u => u.id === m.id);
        return upd ? { ...m, seenBy: upd.seenBy } : m;
      }));
    });

    return () => {
      socket.off("previous_messages"); socket.off("receive_message");
      socket.off("room_users"); socket.off("typing_users");
      socket.off("room_error"); socket.off("message_updated");
      socket.off("seen_update");
    };
  }, [roomCode, username, roomPassword, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, typingUsers]);

  // Mark seen when tab focused
  useEffect(() => {
    const fn = () => socket.emit("mark_seen", { roomCode, username });
    window.addEventListener("focus", fn);
    return () => window.removeEventListener("focus", fn);
  }, [roomCode, username]);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send_message", {
      roomCode, username,
      message: message.trim(),
      replyTo: replyTo ? { id: replyTo.id, username: replyTo.username, message: replyTo.message || replyTo.fileName } : null
    });
    setMessage(""); setReplyTo(null);
    socket.emit("stop_typing", { roomCode, username });
    textareaRef.current?.focus();
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { roomCode, username });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("stop_typing", { roomCode, username }), 1200);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("File too large! Max 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("send_file", {
        roomCode, username,
        fileName: file.name,
        fileType: file.type,
        fileData: reader.result,
        replyTo: replyTo ? { id: replyTo.id, username: replyTo.username, message: replyTo.message || replyTo.fileName } : null
      });
      setReplyTo(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const saveEdit = (msgId) => {
    if (!editText.trim()) return;
    socket.emit("edit_message", { roomCode, msgId, username, newText: editText.trim() });
    setEditingId(null); setEditText("");
  };

  const deleteMsg = (msgId) => {
    if (!confirm("Delete this message?")) return;
    socket.emit("delete_message", { roomCode, msgId, username });
  };

  const reactToMsg = (msgId, emoji) => {
    socket.emit("react_message", { roomCode, msgId, username, emoji });
    setShowEmoji(null);
  };

  const copyMsg = (text) => { navigator.clipboard?.writeText(text); showToast("Copied! 📋"); };
  const copyCode = () => { navigator.clipboard?.writeText(roomCode); showToast("Room code copied! 📋"); };
  const copyLink = () => { navigator.clipboard?.writeText(`${window.location.origin}/room/${roomCode}`); showToast("Link copied! 🔗"); };
  const leaveRoom = () => { localStorage.removeItem("username"); localStorage.removeItem("roomPassword"); window.location.href = "/"; };

  const isSeen = (msg) => {
    if (!msg.seenBy || users.length <= 1) return false;
    return users.some(u => u !== msg.username && msg.seenBy?.includes(u));
  };

  const othersTyping = typingUsers.filter(u => u !== username);

  const renderMessage = (msg) => {
    if (msg.type === "system") {
      return <div key={msg.id} className="g-bubble system-b">{msg.message}</div>;
    }

    const isMe = msg.username === username;
    const isEditing = editingId === msg.id;

    return (
      <div key={msg.id} className={`g-bubble-wrap ${isMe ? "mine-w" : "other-w"}`}>
        {/* Hover actions */}
        {!msg.deleted && (
          <div className="g-actions">
            {/* Emoji */}
            {showEmoji === msg.id ? (
              <div className="emoji-picker">
                {EMOJI_LIST.map(e => (
                  <button key={e} className="emoji-btn" onClick={() => reactToMsg(msg.id, e)}>{e}</button>
                ))}
                <button className="emoji-btn" onClick={() => setShowEmoji(null)}>✕</button>
              </div>
            ) : (
              <>
                <button className="g-action-btn" title="React" onClick={() => setShowEmoji(msg.id)}>😊</button>
                <button className="g-action-btn" title="Reply" onClick={() => setReplyTo(msg)}>↩️</button>
                {(msg.type === "text" || !msg.type) && <button className="g-action-btn" title="Copy" onClick={() => copyMsg(msg.message)}>📋</button>}
                {isMe && msg.type === "text" && <button className="g-action-btn" title="Edit" onClick={() => { setEditingId(msg.id); setEditText(msg.message); }}>✏️</button>}
                {isMe && <button className="g-action-btn" title="Delete" onClick={() => deleteMsg(msg.id)}>🗑️</button>}
              </>
            )}
          </div>
        )}

        <div className={`g-bubble ${isMe ? "mine" : "other"} ${msg.deleted ? "deleted" : ""}`}>
          {/* Reply preview */}
          {msg.replyTo && (
            <div className="reply-preview">
              <span>{msg.replyTo.username}</span>: {msg.replyTo.message}
            </div>
          )}

          {!isMe && <div className="g-bhead"><span className="g-bname">{msg.username}</span></div>}

          {/* Content */}
          {isEditing ? (
            <div>
              <input className="g-edit-input" value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(msg.id); if (e.key === "Escape") { setEditingId(null); } }}
                autoFocus />
              <div className="g-edit-actions">
                <button className="g-edit-save" onClick={() => saveEdit(msg.id)}>Save</button>
                <button className="g-edit-cancel" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : msg.type === "image" ? (
            <div className="g-img-msg" onClick={() => setImgModal(msg.fileData)}>
              <img src={msg.fileData} alt={msg.fileName} />
            </div>
          ) : msg.type === "file" ? (
            <a className="g-file-msg" href={msg.fileData} download={msg.fileName}>
              <span className="g-file-icon">📎</span>
              <span className="g-file-name">{msg.fileName}</span>
            </a>
          ) : (
            <div className="g-btext">
              {msg.message}
              {msg.edited && <span className="g-edited">(edited)</span>}
            </div>
          )}

          {/* Time + ticks */}
          <div className="g-btime" style={{ justifyContent: isMe ? "flex-end" : "flex-start", marginTop: 4 }}>
            {msg.time}
            {isMe && !msg.deleted && (
              <span className={`g-ticks ${isSeen(msg) ? "seen" : ""}`}>
                {isSeen(msg) ? "✓✓" : "✓"}
              </span>
            )}
          </div>

          {/* Reactions */}
          {msg.reactions && Object.keys(msg.reactions).filter(e => msg.reactions[e].length > 0).length > 0 && (
            <div className="g-reactions">
              {Object.entries(msg.reactions).filter(([, users]) => users.length > 0).map(([emoji, reactUsers]) => (
                <span key={emoji}
                  className={`g-reaction ${reactUsers.includes(username) ? "mine-r" : ""}`}
                  onClick={() => reactToMsg(msg.id, emoji)}
                  title={reactUsers.join(", ")}>
                  {emoji} {reactUsers.length}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="chat-page">
        <div className="gnoise"/>
        <div className="gorb go1"/><div className="gorb go2"/><div className="gorb go3"/>
        {toast && <div className="g-toast">{toast}</div>}
        {imgModal && <div className="img-modal" onClick={() => setImgModal(null)}><img src={imgModal} alt=""/></div>}

        <div className="chat-wrap">
          {/* Topbar */}
          <div className="g-topbar">
            <div className="g-top-left">
              <div className="g-top-dp">
                <img src="/dp.jpg" alt="Dharshii" onError={e => e.target.style.display='none'}/>
              </div>
              <div>
                <div className="g-top-title">Dharshii's Room</div>
                <div className="g-top-sub">Private • Password protected 🔐</div>
              </div>
            </div>
            <div className="g-top-btns">
              <button className="g-btn-sm g-btn-ghost" onClick={copyCode}>Copy Code</button>
              <button className="g-btn-sm g-btn-ghost" onClick={copyLink}>Copy Link</button>
              <button className="g-btn-sm g-btn-danger" onClick={leaveRoom}>Leave</button>
            </div>
          </div>

          {/* Meta */}
          <div className="g-meta">
            <div className="g-online">
              <span className="g-dot"/>
              {users.length} online &nbsp;·&nbsp;
              <span style={{fontFamily:"'Syne',sans-serif",letterSpacing:"1px",color:"#00ff44"}}>{roomCode}</span>
            </div>
            <div className="g-chips">
              {users.map(u => (
                <span key={u} className={`g-chip ${u === username ? "me" : ""}`}>{u}</span>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="g-messages">
            {chat.map(renderMessage)}
            {othersTyping.length > 0 && (
              <div className="g-typing">✦ {othersTyping.join(", ")} {othersTyping.length === 1 ? "is" : "are"} typing…</div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Reply bar */}
          {replyTo && (
            <div className="g-reply-bar">
              <div className="g-reply-info">
                Replying to <span>{replyTo.username}</span>: {(replyTo.message || replyTo.fileName || "").slice(0, 40)}
              </div>
              <button className="g-reply-cancel" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}

          {/* Input */}
          <div className="g-input-row">
            <input type="file" ref={fileRef} style={{display:"none"}} onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"/>
            <button className="g-attach-btn" onClick={() => fileRef.current?.click()} title="Send file">📎</button>
            <textarea
              ref={textareaRef}
              className="g-chat-inp"
              placeholder="Say something… 💚"
              value={message}
              onChange={handleTyping}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
            />
            <button className="g-send-btn" onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
}
