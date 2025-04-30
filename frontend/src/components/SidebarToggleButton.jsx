// src/components/SidebarToggleButton.jsx
import React, { useState, useEffect } from "react";

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

const SidebarToggleButton = ({ toggleSidebar }) => {
  const isMobile = useMobile();
  if (isMobile) return null;
  return (
    <button style={styles.button} onClick={toggleSidebar}>
      ☰
    </button>
  );
};

const styles = {
  button: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    background: "rgba(50,51,50,255)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "10px 15px",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
    zIndex: 1000,
    outline: "none",
  },
};

export default SidebarToggleButton;
