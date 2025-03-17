// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import userIcon from "../assets/user.png";

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

const Sidebar = ({ open, toggleSidebar }) => {
  const isMobile = useMobile();
  return (
    <div
      style={{
        ...styles.sidebar,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }}
    >
      <button style={styles.closeButton} onClick={toggleSidebar}>
        Close
      </button>
      <h3>Your PDFs</h3>
      <ul>
        <li>PDF 1</li>
        <li>PDF 2</li>
        <li>PDF 3</li>
      </ul>
      {isMobile && (
        <div style={styles.userTile}>
          <img src={userIcon} alt="User" style={styles.userIcon} />
          <span>User</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  sidebar: {
    position: "absolute",
    top: "60px", // adjust for Navbar height
    bottom: 0,
    left: 0,
    width: "250px",
    background: "rgba(0, 0, 0, 0.8)",
    padding: "20px",
    color: "#fff",
    overflowY: "auto",
    zIndex: 999,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    marginBottom: "20px",
  },
  userTile: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    display: "flex",
    alignItems: "center",
    background: "rgba(128, 128, 128, 0.5)",
    padding: "10px",
    borderRadius: "5px",
  },
  userIcon: {
    height: "30px",
    width: "30px",
    marginRight: "10px",
  },
};

export default Sidebar;
