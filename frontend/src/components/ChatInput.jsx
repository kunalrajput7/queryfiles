// src/components/ChatInput.jsx
import React, { useState } from "react";

const ChatInput = ({ disabled }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    // Add your message sending logic here
    console.log("Chat message:", input);
    setInput("");
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={styles.input}
        disabled={disabled}
      />
      <button style={styles.sendButton} onClick={handleSend} disabled={disabled}>
        Send
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    width: "100%",
    marginTop: "20px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "20px",
    padding: "10px",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#fff",
    padding: "10px",
  },
  sendButton: {
    background: "rgba(128, 128, 128, 0.5)",
    border: "none",
    padding: "10px 20px",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default ChatInput;
