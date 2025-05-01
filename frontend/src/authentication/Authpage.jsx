import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebaseConfig.jsx";
import { useNavigate } from "react-router-dom";
import {
  AiFillGithub,
  AiOutlineTwitter,
  AiFillInstagram,
} from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";
import { AbstractShapeBg } from "../assets/AbstractShapeBg.module.js";

// Assets
import logo from "../assets/logo.png";

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

const AuthPage = () => {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const colorbg = new AbstractShapeBg({
      dom: "box",
      colors: [
        "#1c1c1c",
        "#121212",
        "#242424",
        "#080808",
        "#2b2b2b",
        "#010101",
      ],
      loop: true,
    });
    return () => colorbg.destroy?.();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={isMobile ? styles.mobileContainer : styles.container}>
      <div id="box" style={styles.backgroundCanvas}></div>
      <div style={isMobile ? styles.mobileLeftHalf : styles.leftHalf}>
        <div style={styles.header}>
          <img src={logo} alt="QueryFiles Logo" style={styles.logo} />
          <h1 style={styles.title}>QUERYFILES</h1>
        </div>
        <div style={isMobile ? styles.mobileAuthBox : styles.authBox}>
          <div style={styles.authBoxInner}>
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
            <form
              onSubmit={activeTab === "login" ? handleLogin : handleSignup}
              style={styles.form}
            >
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
              <button type="submit" style={styles.button}>
                {activeTab === "login" ? "Login" : "Sign Up"}
              </button>
            </form>
          </div>
        </div>
        <div
          style={isMobile ? styles.mobileFooterContent : styles.footerContent}
        >
          <div style={styles.footerText}>
            <p style={styles.footerTextP}>
              Designed and Developed by{" "}
              <a
                href="https://www.linkedin.com/in/kunalrajput007/"
                style={styles.footerLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Kunal Rajput
              </a>
            </p>
          </div>
          <div style={isMobile ? styles.mobileFooterIcons : styles.footerIcons}>
            <a
              href="https://github.com/kunalrajput7"
              style={styles.socialIcon}
              target="_blank"
              rel="noopener noreferrer"
            >
              <AiFillGithub size={20} />
            </a>
            <a
              href="https://twitter.com/kunal7rajput"
              style={styles.socialIcon}
              target="_blank"
              rel="noopener noreferrer"
            >
              <AiOutlineTwitter size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/kunalrajput1/"
              style={styles.socialIcon}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedinIn size={20} />
            </a>
            <a
              href="https://www.instagram.com/kunalrajput555_"
              style={styles.socialIcon}
              target="_blank"
              rel="noopener noreferrer"
            >
              <AiFillInstagram size={20} />
            </a>
          </div>
          <div style={isMobile ? styles.mobileCopyright : styles.copyright}>
            <p>Copyright © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
    color: "#fff",
    boxSizing: "border-box",
  },
  mobileContainer: {
    display: "flex",
    justifyContent: "space-evenly",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
    color: "#fff",
    padding: "20px",
    boxSizing: "border-box",
  },
  backgroundCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: -1,
  },
  leftHalf: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "600px",
    padding: "20px",
    boxSizing: "border-box",
  },
  mobileLeftHalf: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box",
    alignItems: "center",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    zIndex: 1,
  },
  logo: {
    height: "50px",
    marginRight: "10px",
  },
  title: {
    fontSize: "50px",
    fontWeight: "bold",
    color: "#fff",
    margin: "20px 0",
    fontFamily: "'Titillium Web', sans-serif",
    textTransform: "uppercase",
  },
  authBox: {
    width: "100%",
    maxWidth: "400px",
    padding: "20px",
    margin: "0 auto",
    boxSizing: "border-box",
    zIndex: 1,
  },
  mobileAuthBox: {
    width: "100%",
    maxWidth: "400px",
    padding: "20px",
    margin: "0 auto",
    marginBottom: "20px",
    boxSizing: "border-box",
    zIndex: 1,
  },
  authBoxInner: {
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    paddingTop: "30px",
    paddingBottom: "30px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  tabContainer: {
    display: "flex",
    width: "100%",
    maxWidth: "300px",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    marginBottom: "20px",
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "16px",
    color: "rgba(255,255,255,0.6)",
    transition: "color 0.3s",
  },
  activeTab: {
    flex: 1,
    padding: "10px 0",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "16px",
    color: "#fff",
    borderBottom: "2px solid #fff",
    transition: "color 0.3s",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "300px",
  },
  input: {
    padding: "12px",
    margin: "10px 0",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "none",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    padding: "12px",
    margin: "10px 0",
    borderRadius: "4px",
    border: "none",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  error: {
    color: "#ff4d4d",
    fontSize: "14px",
    margin: "10px 0",
    textAlign: "center",
    maxWidth: "300px",
  },
  footerContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    marginTop: "auto",
  },
  mobileFooterContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    marginTop: "auto",
  },
  footerText: {
    textAlign: "center",
  },
  footerTextP: {
    fontSize: "12px",
    color: "#fff",
    margin: "0",
  },
  footerLink: {
    color: "#1e90ff",
    textDecoration: "none",
    transition: "color 0.3s",
  },
  footerIcons: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  mobileFooterIcons: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  copyright: {
    fontSize: "12px",
    color: "#fff",
    margin: "0",
    textAlign: "center",
  },
  mobileCopyright: {
    fontSize: "12px",
    color: "#fff",
    margin: "0",
    textAlign: "center",
  },
  socialIcon: {
    color: "#fff",
    textDecoration: "none",
    transition: "color 0.3s",
  },
};

// Google Font and hover effects
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@700&display=swap');
  a.socialIcon:hover {
    color: rgba(255,255,255,0.8);
  }
  a.footerLink:hover {
    color: #87cefa;
  }
  button:hover {
    background: rgba(255,255,255,0.3);
  }
`;
document.head.appendChild(styleSheet);

export default AuthPage;
