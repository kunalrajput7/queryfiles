import React, { useState, useRef, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";

const ChatInput = ({ disabled, uid, onSend }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() || !uid) return;
    onSend(input); // Call onSend with current input
    setInput(""); // Clear input immediately
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      handleSend();
    }
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
        onKeyDown={handleKeyPress}
        style={styles.input}
        disabled={disabled}
        rows={1}
      />
      <button style={styles.sendButton} onClick={handleSend} disabled={disabled}>
        <FaPaperPlane />
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    width: "100%",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "20px",
    padding: "8px",
    alignItems: "flex-end", // Align items to bottom for send button
    marginTop: "10px",
    boxSizing: "border-box",
    border: "1px solid rgba(255, 255, 255, 0.2)", // Thin white border
    position: "relative",
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
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255, 255, 255, 0.1) transparent",
    "::-webkit-scrollbar": {
      width: "6px",
    },
    "::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "3px",
    },
    lineHeight: "22px", // Increased by 2px for default height
    boxSizing: "border-box",
    width: "100%",
    padding: "8px 12px 8px 12px", // Left, right, bottom padding for placeholder
    marginRight: "38px", // Space for send button and scrollbar
  },
  sendButton: {
    background: "#fff",
    border: "none",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    color: "#333",
    fontSize: "16px", // Adjusted for FaPaperPlane icon
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    boxSizing: "border-box",
    position: "absolute",
    right: "12px", // Position at bottom-right
    bottom: "12px",
  },
};

export default ChatInput;