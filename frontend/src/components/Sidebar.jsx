import React, { useState, useEffect, useRef } from "react";
import userIcon from "../assets/user.png";
import logo from "../assets/logo.png";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { FaTrash } from "react-icons/fa";
const API_BASE_URL = "http://127.0.0.1:8000";

const db = getFirestore(getApp());

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

const groupFilesByDate = (files) => {
  const grouped = {
    Today: [],
    Yesterday: [],
    "Last 7 Days": [],
    "Last 30 Days": [],
    Earlier: [],
  };

  const now = new Date();
  files.forEach((file) => {
    if (!file.upload_date?.toDate) return;
    const ts = file.upload_date.toDate();
    const diffDays = (now - ts) / (1000 * 3600 * 24);
    if (diffDays < 1) grouped["Today"].push(file);
    else if (diffDays < 2) grouped["Yesterday"].push(file);
    else if (diffDays < 7) grouped["Last 7 Days"].push(file);
    else if (diffDays < 30) grouped["Last 30 Days"].push(file);
    else grouped["Earlier"].push(file);
  });

  return grouped;
};

const Sidebar = ({
  open,
  toggleSidebar,
  uid,
  onSelectPdf,
  onNewChat,
  activeFile,
}) => {
  const isMobile = useMobile();
  const [files, setFiles] = useState([]);
  const [showLogout, setShowLogout] = useState(false);
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const logoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) return;
    const filesRef = collection(db, "users", uid, "files");
    const q = query(filesRef, orderBy("upload_date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFiles(filesData);
    });
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };
    if (showLogout) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLogout]);

  const groupedFiles = groupFilesByDate(files);

  const handlePdfClick = (file) => {
    onSelectPdf(file);
    if (isMobile) {
      toggleSidebar(); // Close sidebar on file click in mobile view
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    toggleSidebar();
  };

  const handleUserIconClick = () => {
    setShowLogout((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm("I want to Delete the file.")) return;

    try {
      const formData = new FormData();
      formData.append("uid", uid);
      formData.append("fileid", file.id);

      const response = await fetch(`${API_BASE_URL}/delete_file`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            `Failed to delete file with status: ${response.status}`
        );
      }

      console.log(`File ${file.id} deleted successfully`);

      if (activeFile && activeFile.id === file.id) {
        onNewChat(); // Redirect to main page if active file is deleted
      }
    } catch (error) {
      console.error("Delete file error:", error);
      alert(`Error deleting file: ${error.message}`);
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    switch (extension) {
      case ".pdf":
        return "📄";
      case ".docx":
        return "📝";
      case ".xlsx":
      case ".xls":
        return "📊";
      default:
        return "📄";
    }
  };

  return (
    <div
      style={{
        ...styles.sidebar,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
        boxShadow: isMobile ? "none" : "4px 0 12px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div style={styles.header}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <span style={{ ...styles.title, fontSize: isMobile ? "22px" : "18px" }}>
          QueryFiles
        </span>
      </div>
      <div style={styles.newChatTile} onClick={handleNewChatClick}>
        New Document
      </div>
      {uid ? (
        Object.keys(groupedFiles).map(
          (category) =>
            groupedFiles[category].length > 0 && (
              <div key={category}>
                <h4 style={styles.categoryHeader}>{category}</h4>
                <ul style={styles.fileList}>
                  {groupedFiles[category].map((file) => (
                    <li
                      key={file.id}
                      style={
                        activeFile && file.id === activeFile.id
                          ? styles.fileTile
                          : styles.fileTileTransparent
                      }
                      onClick={() => handlePdfClick(file)}
                      onMouseEnter={
                        isMobile ? null : () => setHoveredFileId(file.id)
                      }
                      onMouseLeave={
                        isMobile ? null : () => setHoveredFileId(null)
                      }
                    >
                      <span style={styles.fileIcon}>
                        {getFileIcon(file.filename)}
                      </span>
                      <span
                        style={
                          isMobile ? styles.fileTextMobile : styles.fileText
                        }
                      >
                        {file.filename}
                      </span>
                      {(isMobile || hoveredFileId === file.id) && (
                        <span
                          style={styles.deleteIcon}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering handlePdfClick
                            handleDeleteFile(file);
                          }}
                        >
                          <FaTrash />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
        )
      ) : (
        <p style={styles.noUserText}>No user logged in.</p>
      )}
      {isMobile && (
        <div style={styles.userTile}>
          <div style={styles.userContainer}>
            <img
              src={userIcon}
              alt="User"
              style={styles.userIcon}
              onClick={handleUserIconClick}
            />
            <span>User</span>
            {showLogout && (
              <div style={styles.logoutBox} ref={logoutRef}>
                <span style={styles.logoutText} onClick={handleLogout}>
                  Logout
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "230px",
    background: "rgba(33,32,33,255)",
    padding: "10px",
    color: "#fff",
    overflowY: "auto",
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
    zIndex: 999,
    borderTopRightRadius: "12px",
    borderBottomRightRadius: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #444",
    marginBottom: "10px",
  },
  logo: {
    height: "30px",
    marginRight: "8px",
  },
  title: {
    fontWeight: "bold",
  },
  newChatTile: {
    background: "rgba(255, 255, 255, 0.1)",
    padding: "6px",
    borderRadius: "4px",
    marginBottom: "10px",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "center",
  },
  pdfHeader: {
    fontSize: "15px",
    marginBottom: "10px",
  },
  categoryHeader: {
    marginTop: "12px",
    borderBottom: "1px solid #555",
    paddingBottom: "4px",
    fontSize: "10px",
  },
  fileList: {
    listStyleType: "none",
    padding: "0px",
  },
  fileTile: {
    background: "rgba(255, 255, 255, 0.1)",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "6px",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  fileTileTransparent: {
    background: "transparent",
    padding: "8px",
    marginBottom: "6px",
    cursor: "pointer",
    fontSize: "13px",
    transition: "background 0.2s ease",
    display: "flex",
    alignItems: "center",
    position: "relative",
    ":hover": {
      background: "rgba(255, 255, 255, 0.1)",
    },
  },
  fileIcon: {
    marginRight: "6px",
    fontSize: "1.2em",
    flexShrink: 0,
  },
  fileText: {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  },
  fileTextMobile: {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    maxWidth: "120px", // Shorter text in mobile view to accommodate delete icon
  },
  deleteIcon: {
    color: "#fff",
    marginLeft: "10px",
    cursor: "pointer",
    fontSize: "1em",
    flexShrink: 0,
    zIndex: 1000, // Ensure icon is on top
  },
  noUserText: {
    fontSize: "12px",
  },
  userTile: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
  },
  userContainer: {
    display: "flex",
    alignItems: "center",
    background: "rgba(128, 128, 128, 0.5)",
    padding: "6px",
    borderRadius: "4px",
    position: "relative",
    cursor: "pointer",
  },
  userIcon: {
    height: "20px",
    width: "20px",
    marginRight: "6px",
  },
  logoutBox: {
    position: "absolute",
    bottom: "40px",
    left: "0",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "8px 12px",
    borderRadius: "4px",
    zIndex: 100,
  },
  logoutText: {
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default Sidebar;