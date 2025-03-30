// src/AuthPage.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login"); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Redirect to main page on success
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/"); // Redirect to main page on success
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        <div
          style={activeTab === "login" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("login")}
        >
          Login
        </div>
        <div
          style={activeTab === "signup" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("signup")}
        >
          Sign Up
        </div>
      </div>
      {error && <p style={styles.error}>{error}</p>}
      {activeTab === "login" && (
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
      )}
      {activeTab === "signup" && (
        <form onSubmit={handleSignup} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Sign Up</button>
        </form>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "linear-gradient(135deg, #1a1a1a, #121212)",
    color: "#fff",
    padding: "20px",
    boxSizing: "border-box",
  },
  tabContainer: {
    display: "flex",
    marginBottom: "20px",
  },
  tab: {
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  activeTab: {
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: "2px solid #007bff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "400px",
  },
  input: {
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "none",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "none",
    background: "#007bff",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};

export default AuthPage;
