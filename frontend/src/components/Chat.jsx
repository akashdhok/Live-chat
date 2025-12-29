import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
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

  const messagesEndRef = useRef(null);

  // --- LOAD OLD MESSAGES ---
  useEffect(() => {
    axios.get(`${BASE_URL}/messages`).then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data?.messages || [];
      setChat(data);
    });
  }, []);

  // --- SCROLL TO BOTTOM WHEN CHAT UPDATES ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    socket.on("receive_message", data => {
      setChat(prev => [...prev, data]);
    });

    socket.on("online_users", list => setUsers(list));

    socket.on("user_typing", data => {
      if (data.typing) setTypingUser(data.name);
      else setTypingUser("");
    });

    return () => {
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("user_typing");
    };
  }, []);

  // --- JOIN CHAT ---
  const joinChat = () => {
    if (!name.trim()) return alert("Enter name");
    socket.emit("join_user", name);
    setJoined(true);
  };

  // --- SEND MESSAGE ---
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", { name, message });
    socket.emit("typing_stop", name);

    setMessage("");
  };

  return (
    <div className="app">

      {!joined ? (
        <div className="join-card">
          <h2>Join Chat</h2>

          <input
            className="input"
            placeholder="Enter your name..."
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <button className="btn" onClick={joinChat}>Enter Chat</button>
        </div>
      ) : (

        <div className="chat-layout">

          {/* LEFT USERS PANEL */}
          <div className="users-panel">
            <h3>🟢 Online Users</h3>

            {users.map((u, i) => (
              <div key={i} className={u === name ? "user-item me-user" : "user-item"}>
                {u}
              </div>
            ))}
          </div>

          {/* CHAT BOX */}
          <div className="chat-box">

            <div className="header">
              Welcome <b>{name}</b>
            </div>

            {typingUser && typingUser !== name && (
              <div className="typing">
                🟡 {typingUser} is typing...
              </div>
            )}

            <div className="messages">

              {chat.map((m, i) => (
                <div
                  key={i}
                  className={m.name === name ? "msg me" : "msg"}
                >
                  <div className="bubble">
                    <span className="user">
                      {m.name === name ? "You" : m.name}
                    </span>

                    <pre className="text">{m.message}</pre>
                  </div>
                </div>
              ))}

              {/* AUTO SCROLL TARGET */}
              <div ref={messagesEndRef}></div>
            </div>

            {/* INPUT AREA */}
            <div className="input-row">

              <textarea
                className="input input-textarea"
                placeholder="Type message..."
                value={message}
                onChange={e => {
                  setMessage(e.target.value);
                  socket.emit("typing_start", name);
                }}
                onBlur={() => socket.emit("typing_stop", name)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button className="btn" onClick={sendMessage}>
                Send
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
