import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";
import BASE_URL from "../../config/base";

const socket = io(BASE_URL);

export default function Chat() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);

  // LOAD MESSAGES
  useEffect(() => {
    axios.get(`${BASE_URL}/messages`).then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data?.messages || [];
      setChat(data);
    });
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // SOCKET LISTENERS
  useEffect(() => {
    socket.on("receive_message", data => setChat(prev => [...prev, data]));
    socket.on("online_users", list => setUsers(list));

    socket.on("user_typing", data =>
      setTypingUser(data.typing ? data.name : "")
    );

    socket.on("user_event", evt => {
      setToast(evt.type === "join" ? `${evt.name} joined` : `${evt.name} left`);
      setTimeout(() => setToast(null), 2000);
    });

    return () => {
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("user_typing");
      socket.off("user_event");
    };
  }, []);

  // JOIN
  const joinChat = () => {
    if (!name.trim()) return;
    socket.emit("join_user", name);
    setJoined(true);
  };

  // SEND
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send_message", { name, message });
    socket.emit("typing_stop", name);
    setMessage("");
  };

  return (
    <div className="app">

      {toast && <div className="toast">{toast}</div>}

      {!joined ? (
        <div className="join-card">
          <h2>Join Chat</h2>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
          <button className="btn" onClick={joinChat}>Enter</button>
        </div>
      ) : (

        <div className="chat-layout">

          {/* USERS */}
          <div className="users-panel">
            <h3>🟢 Online ({users.length})</h3>

            {users.map((u,i)=>(
              <div key={i} className={u===name ? "user-item me-user" : "user-item"}>
                <span className="dot"></span>
                {u}
              </div>
            ))}
          </div>

          {/* CHAT */}
          <div className="chat-box">

            <div className="header">Welcome {name}</div>

            {typingUser && typingUser!==name && (
              <div className="typing-anim">
                {typingUser} is typing
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}

            <div className="messages">
              {chat.map((m,i)=>(
                <div key={i} className={m.name===name ? "msg me" : "msg"}>
                  <div className="bubble">
                    <span className="user">{m.name===name?"You":m.name}</span>
                    <pre className="text">{m.message}</pre>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>

            <div className="input-row">

              <button className="emoji-btn" onClick={()=>setShowEmoji(v=>!v)}>😀</button>

              {showEmoji && (
                <div className="emoji-box">
                  <EmojiPicker onEmojiClick={e=>setMessage(prev=>prev+e.emoji)}/>
                </div>
              )}

              <textarea
                className="input input-textarea"
                value={message}
                placeholder="Type message..."
                onChange={e=>{
                  setMessage(e.target.value);
                  socket.emit("typing_start", name);
                }}
                onBlur={()=>socket.emit("typing_stop", name)}
                onKeyDown={e=>{
                  if(e.key==="Enter" && !e.shiftKey){
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button className="btn send-btn" onClick={sendMessage}>Send</button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
