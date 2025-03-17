// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
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

const Navbar = ({ toggleSidebar }) => {
  const isMobile = useMobile();
  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <span style={styles.title}>SmartPDF</span>
      </div>
      <div style={styles.right}>
        {isMobile ? (
          <button style={styles.sidebarButton} onClick={toggleSidebar}>
            ☰
          </button>
        ) : (
          <img src={userIcon} alt="User" style={styles.userIcon} />
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    background: "transparent",
    zIndex: 1000,
  },
  left: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: "40px",
    marginRight: "10px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
  },
  right: {
    display: "flex",
    alignItems: "center",
  },
  userIcon: {
    padding: 5,
    height: "30px",
    width: "30px",
  },
  sidebarButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
  },
};

export default Navbar;
