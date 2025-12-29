import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./chat.css";
import BASE_URL from "../../config/base";

const socket = io(`${BASE_URL}`);

export default function Chat() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load messages from API
  useEffect(() => {
    axios
      .get(`${BASE_URL}/messages`)
      .then(res => {
        // ---- IMPORTANT FIX ----
        const data =
          Array.isArray(res.data)
            ? res.data
            : res.data?.messages || [];

        setChat(data);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  // Realtime listener
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat(prev => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, []);

  const joinChat = () => {
    if (!name.trim()) return alert("Please enter name");
    setJoined(true);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const data = { name, message };

    socket.emit("send_message", data);

    setMessage("");
  };

  return (
    <div className="outer">
      {!joined ? (
        <div className="card">
          <h2>Join Chat</h2>

          <input
            className="input"
            placeholder="Enter your name..."
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <button className="btn" onClick={joinChat}>
            Enter Chat
          </button>
        </div>
      ) : (
        <div className="chat-box">
          <div className="header">
            Welcome, <b>{name}</b>
          </div>

          <div className="messages">
            {loading && <p style={{color:"#777"}}>Loading chat...</p>}

            {Array.isArray(chat) &&
              chat.map((m, i) => (
                <div
                  key={i}
                  className={m.name === name ? "msg me" : "msg"}
                >
                  <span className="user">{m.name}</span>
                  <span>{m.message}</span>
                </div>
              ))}
          </div>

          <div className="input-row">
            <input
              className="input"
              placeholder="Type message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button className="btn" onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
