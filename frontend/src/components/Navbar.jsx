import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getAuth } from "firebase/auth";
import { FaUserCircle, FaTimes } from "react-icons/fa";
import logo from "../assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const isMobile = useMobile();
  const [showLogout, setShowLogout] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [theme, setTheme] = useState("dark"); // Default theme
  const logoutRef = useRef(null);
  const userInfoRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleUserIconClick = () => {
    setShowUserInfo((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/authpage");
    } catch (err) {
      console.error("Error signing out:", err);
      alert("Error signing out: " + err.message);
    }
  };

  const handleEditPassword = () => {
    alert("Edit Password functionality requires backend implementation.");
  };

  const handleClearData = async () => {
    if (!auth.currentUser?.uid) {
      alert("No user is logged in.");
      return;
    }
    if (!window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/clear_data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: auth.currentUser.uid }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to clear data.");
      }
      const data = await response.json();
      alert(data.message || "All data cleared successfully.");
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Error clearing data: " + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser?.uid) {
      alert("No user is logged in.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/delete_account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: auth.currentUser.uid }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete account.");
      }
      const data = await response.json();
      await signOut(auth);
      alert(data.message || "Account deleted and logged out successfully.");
      navigate("/authpage");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error deleting account: " + error.message);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    // Note: Actual theme change requires app-wide CSS or context
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (logoutRef.current && !logoutRef.current.contains(event.target)) ||
        (userInfoRef.current && !userInfoRef.current.contains(event.target))
      ) {
        setShowLogout(false);
        setShowUserInfo(false);
      }
    };
    if (showLogout || showUserInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLogout, showUserInfo]);

  return (
    <nav style={styles.nav}>
  <div style={{ ...styles.left, ...(sidebarOpen ? styles.hidden : {}) }}>
    <img src={logo} alt="Logo" style={styles.logo} />
    <span style={styles.title}>QueryFiles</span>
  </div>
  <div style={styles.right}>
    {isMobile ? (
      <div style={styles.buttonContainer}>
        <FaUserCircle
          style={styles.userIcon}
          onClick={handleUserIconClick}
        />
        <button style={styles.sidebarButton} onClick={toggleSidebar}>
          ☰
        </button>
      </div>
    ) : (
      <div style={isMobile? styles.userIcon : styles.userIconMobile}>
        <FaUserCircle
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

  {showUserInfo && (
    <>
      <div style={styles.backdrop} onClick={() => setShowUserInfo(false)} />
      <div style={{ ...styles.userInfoBox, ...(isMobile ? styles.userInfoBoxMobile : {}) }} ref={userInfoRef}>
        <div style={styles.header}>
          <h2 style={{ ...styles.infoHeading, ...(isMobile ? { fontSize: "20px" } : {}) }}>Information</h2>
          <button
            style={styles.closeButton}
            onClick={() => setShowUserInfo(false)}
          >
            <FaTimes />
          </button>
        </div>
        <div style={styles.infoContent}>
          <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
            <span style={styles.infoLabel}>Email ID:</span>
            <span style={styles.infoValue}>{auth.currentUser?.email || "N/A"}</span>
          </div>
          <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
            <span style={styles.infoLabel}>Password:</span>
            <div style={styles.infoValue}>
              ********
              <button
                style={styles.inlineButton}
                onClick={handleEditPassword}
              >
                Edit Password
              </button>
            </div>
          </div>
          <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
            <span style={styles.infoLabel}>Theme:</span>
            <div style={styles.infoValue}>
              <button
                style={styles.inlineButton}
                onClick={toggleTheme}
              >
                Switch to {theme === "dark" ? "Light" : "Dark"} Mode
              </button>
            </div>
          </div>
        </div>
        <div style={styles.actionButtons}>
          <button
            style={styles.actionButton}
            onClick={handleClearData}
          >
            Clear All Data
          </button>
          <button
            style={styles.actionButton}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
          <button
            style={styles.actionButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  )}
</nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // padding: "10px 20px",
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
    gap: "10px",
    marginBottom: "20px",
    paddingLeft: "20px",
    // background: "white",
  },
  hidden: {
    visibility: "hidden",
  },
  logo: {
    height: "30px",
    marginRight: "10px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
  },
  right: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    paddingBottom: "20px",
  },
  userContainer: {
    position: "relative",
    cursor: "pointer",
    
  },
  userIcon: {
    fontSize: "26px",
    color: "#fff",
    cursor: "pointer",
    marginTop: "15px",
    padding: "0px",

  },
  userIconMobile: {
    marginTop: "15px",
    marginRight: "20px",
    fontSize: "26px",
    color: "#fff",
    cursor: "pointer",
    
  },
  logoutBox: {
    position: "absolute",
    top: "40px",
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
    color: "rgba(255,255,255,0.9)",
    fontSize: "24px",
    cursor: "pointer",
    outline: "none",
  },
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    zIndex: 1002,
  },
  userInfoBox: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(50,51,50,255)",
    borderRadius: "8px",
    padding: "20px",
    width: "90%",
    maxWidth: "400px",
    color: "#fff",
    zIndex: 1003,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  userInfoBoxMobile: {
    width: "100%",
    maxWidth: "none",
    padding: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  infoHeading: {
    fontSize: "24px",
    margin: 0,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 0,
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  infoContent: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    alignItems: "center",
    fontSize: "16px",
  },
  infoRowMobile: {
    gridTemplateColumns: "80px 1fr",
    fontSize: "14px",
  },
  infoLabel: {
    textAlign: "left",
    fontWeight: "500",
  },
  infoValue: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
  },
  inlineButton: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#fff",
    padding: "5px 10px",
    borderRadius: "15px",
    cursor: "pointer",
    fontSize: "14px",
  },
  actionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  actionButton: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#fff",
    borderRadius: "15px",
    cursor: "pointer",
    fontSize: "16px",
    textAlign: "center",
  },
};

export default Navbar;