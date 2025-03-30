// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from "react";

const ChatInput = ({ disabled, uid, onSend }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() || !uid) return;
    onSend(input); // Call onSend with current input
    setInput(""); // Clear input immediately
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    }
  }, [input]);

  return (
    <div style={styles.container}>
      <textarea
        ref={textareaRef}
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={styles.input}
        disabled={disabled}
        rows={1}
      />
      <button style={styles.sendButton} onClick={handleSend} disabled={disabled}>
        ↑
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    width: "100%",
    background: "#504f59",
    borderRadius: "20px",
    padding: "8px",
    alignItems: "flex-start",
    marginTop: "10px",
    boxSizing: "border-box",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#fff",
    resize: "none",
    overflowY: "auto",
    maxHeight: "220px",
    scrollbarWidth: "none",
    "::-webkit-scrollbar": { display: "none" },
    lineHeight: "20px",
    boxSizing: "border-box",
    width: "100%",
  },
  sendButton: {
    background: "#fff",
    border: "none",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    color: "#333",
    fontSize: "20px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    padding: "0",
    boxSizing: "border-box",
  },
};

export default ChatInput;