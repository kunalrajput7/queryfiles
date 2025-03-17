// src/components/UploadSection.jsx
import React from "react";

const UploadSection = ({ onOpenSidebar, onUploadPdf }) => {
  return (
    <div style={styles.container}>
      <h2>Hello! How can I help you today?</h2>
      <p>Upload a new file to get started or open sidebar to continue with previous files.</p>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={onOpenSidebar}>Open Sidebar</button>
        <button style={styles.button} onClick={onUploadPdf}>Upload PDF</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    margin: "20px",
    padding: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
  },
  buttonContainer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  },
  button: {
    backgroundColor: "rgba(128, 128, 128, 0.5)",
    border: "none",
    padding: "10px 20px",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default UploadSection;
