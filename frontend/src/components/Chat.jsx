import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./chat.css";
import BASE_URL from "../../config/base";

// IMPORTANT — autoConnect false
const socket = io(BASE_URL, { autoConnect: false });

export default function Chat() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const messagesEndRef = useRef(null);

  // ------- LOAD OLD MESSAGES -------
  useEffect(() => {
    axios.get(`${BASE_URL}/messages`).then(res => {
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.messages || [];
      setChat(data);
    });
  }, []);

  // ------- AUTO SCROLL -------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ------- RESTORE SESSION (AUTO JOIN ON RELOAD) -------
  useEffect(() => {
    const saved = localStorage.getItem("chatUser");

    if (saved) {
      setName(saved);
      socket.connect();                 // connect socket
      socket.emit("join_user", saved);  // join backend
      setJoined(true);
    }
  }, []);

  // ------- SOCKET LISTENERS -------
  useEffect(() => {
    socket.on("receive_message", data =>
      setChat(prev => [...prev, data])
    );

    socket.on("online_users", list => setUsers(list));

    socket.on("user_typing", data =>
      setTypingUser(data.typing ? data.name : "")
    );

    return () => {
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("user_typing");
    };
  }, []);

  // ------- JOIN CHAT -------
  const joinChat = () => {
    if (!name.trim()) return alert("Enter name");

    localStorage.setItem("chatUser", name);

    socket.connect();
    socket.emit("join_user", name);

    setJoined(true);
  };

  // ------- SEND MESSAGE -------
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", { name, message });
    socket.emit("typing_stop", name);

    setMessage("");
  };

  // ------- LEAVE CHAT -------
  const leaveChat = () => {
    socket.emit("typing_stop", name);

    localStorage.removeItem("chatUser");

    socket.disconnect();

    setJoined(false);
    setUsers([]);
    setChat([]);
    setTypingUser("");
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

          {/* USERS PANEL */}
          <div className="users-panel">
            <h3>🟢 Online ({users.length})</h3>

            {users.map((u, i) => (
              <div key={i} className={u === name ? "user-item me-user" : "user-item"}>
                <span className="dot"></span>
                {u}
              </div>
            ))}
          </div>

          {/* CHAT BOX */}
          <div className="chat-box">

            <div className="header">
              Welcome <b>{name}</b>

              <button className="leave-btn" onClick={leaveChat}>
                Leave
              </button>
            </div>

            {typingUser && typingUser !== name && (
              <div className="typing-anim">
                {typingUser} is typing<span>.</span><span>.</span><span>.</span>
              </div>
            )}

            <div className="messages">
              {chat.map((m, i) => (
                <div key={i} className={m.name === name ? "msg me" : "msg"}>
                  <div className="bubble">
                    <span className="user">
                      {m.name === name ? "You" : m.name}
                    </span>
                    <pre className="text">{m.message}</pre>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef}></div>
            </div>

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

              <button className="btn" onClick={sendMessage}>Send</button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
