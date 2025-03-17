// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Adjust path if needed
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
  const [showLogout, setShowLogout] = useState(false);
  const logoutRef = useRef(null);
  const navigate = useNavigate();

  // Toggle logout box when user icon is clicked
  const handleUserIconClick = () => {
    setShowLogout((prev) => !prev);
  };

  // Logout function: sign out and navigate to login
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Close logout box when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };
    if (showLogout) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogout]);

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
          <div style={styles.userContainer}>
            <img
              src={userIcon}
              alt="User"
              style={styles.userIcon}
              onClick={handleUserIconClick}
            />
            {showLogout && (
              <div style={styles.logoutBox} ref={logoutRef}>
                <span style={styles.logoutText} onClick={handleLogout}>
                  Logout
                </span>
              </div>
            )}
          </div>
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
    position: "relative",
  },
  userContainer: {
    position: "relative",
    cursor: "pointer",
  },
  userIcon: {
    padding: 5,
    height: "30px",
    width: "30px",
  },
  logoutBox: {
    position: "absolute",
    top: "40px", // Below the user icon
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "8px 12px",
    borderRadius: "4px",
    zIndex: 1001,
  },
  logoutText: {
    color: "#fff",
    cursor: "pointer",
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
