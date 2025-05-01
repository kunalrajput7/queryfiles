import React, { useState } from "react";

const UploadSection = ({ onOpenSidebar, onUploadPdf }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onUploadPdf(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onUploadPdf(file);
      }
    }
  };

  const validateFile = (file) => {
    const allowedTypes = [".pdf", ".docx", ".xlsx", ".xls"];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!allowedTypes.includes(extension)) {
      alert("Only PDF, Word (.docx), and Excel (.xlsx, .xls) files are allowed.");
      return false;
    }
    
    if (file.size > maxSize) {
      alert("File size exceeds 50MB limit.");
      return false;
    }
    
    return true;
  };

  return (
    <div 
      style={{
        ...styles.container,
        border: dragActive ? "2px dashed #007BFF" : "none",
      }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <h2>Hello! How can I help you today?</h2>
      <p>Upload a new PDF, Word, or Excel file to get started or open sidebar to continue with previous files.</p>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={onOpenSidebar}>
          Open Sidebar
        </button>
        <button
          style={styles.button}
          onClick={() => document.getElementById("hiddenFileInput").click()}
        >
          Upload File
        </button>
      </div>
      <input
        type="file"
        id="hiddenFileInput"
        style={{ display: "none" }}
        accept=".pdf,.docx,.xlsx,.xls"
        onChange={handleFileChange}
      />
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    margin: "20px",
    padding: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "25px",
    color: "white",
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
    color: "white",
    borderRadius: "15px",
    cursor: "pointer",
  },
};

export default UploadSection;