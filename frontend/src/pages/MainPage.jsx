// src/pages/MainPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { getApp } from "firebase/app";
import Navbar from "../components/Navbar";
import UploadSection from "../components/UploadSection";
import Sidebar from "../components/Sidebar";
import ChatInput from "../components/ChatInput";
import SidebarToggleButton from "../components/SidebarToggleButton";
import loadingGif from "../assets/loading.gif";
import typingGif from "../assets/typing.gif"; // New import for typing animation

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

const MainPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatInputHeight, setChatInputHeight] = useState(46);
  const chatAreaRef = useRef(null);
  const chatWrapperRef = useRef(null);
  const isMobile = useMobile();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  useEffect(() => {
    const updateHeight = () => {
      if (chatWrapperRef.current) {
        const height = chatWrapperRef.current.offsetHeight;
        setChatInputHeight(height);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (chatWrapperRef.current) {
      observer.observe(chatWrapperRef.current);
    }
    return () => observer.disconnect();
  }, [activeFile]);

  useEffect(() => {
    if (!currentUser?.uid || !activeFile?.id) {
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    const chatsRef = collection(db, "users", currentUser.uid, "files", activeFile.id, "chats");
    const q = query(chatsRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChatHistory(chatsData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching chat history:", error);
        setChatHistory([{ type: "model", text: "Error loading chat history.", timestamp: new Date().toISOString() }]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, activeFile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePdfUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (currentUser?.uid) {
      formData.append("uid", currentUser.uid);
    }
    try {
      const response = await fetch("http://127.0.0.1:8000/upload_pdf", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
      const data = await response.json();
      console.log("Upload response:", data);

      const uploadedFile = {
        id: data.id,
        filename: data.filename || file.name,
        upload_date: data.upload_date ? { toDate: () => new Date(data.upload_date) } : { toDate: () => new Date() },
      };

      await handleSelectPdf(uploadedFile);
    } catch (error) {
      console.error("Upload error:", error);
      setChatHistory([{ type: "model", text: "Error uploading PDF.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPdf = async (file) => {
    if (!currentUser?.uid) return;
    const formData = new FormData();
    formData.append("uid", currentUser.uid);
    formData.append("fileid", file.id);
    try {
      const response = await fetch("http://127.0.0.1:8000/load_index", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Failed to load index with status: ${response.status}`);
      const data = await response.json();
      console.log("Load index response:", data);
      if (!data.error) {
        setActiveFile(file);
        setIsLoading(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Load index error:", error);
      setChatHistory([{ type: "model", text: "Error loading PDF data.", timestamp: new Date().toISOString() }]);
    }
  };

  const handleNewChat = () => {
    setActiveFile(null);
  };

  const handleSendMessage = async (message) => {
    if (!currentUser?.uid || !activeFile?.id) return;

    const userMessage = {
      type: "user",
      text: message,
      timestamp: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, "users", currentUser.uid, "files", activeFile.id, "chats"), userMessage);
    } catch (error) {
      console.error("Error saving user message:", error);
      setChatHistory((prev) => [
        ...prev,
        { type: "model", text: "Error saving message.", timestamp: new Date().toISOString() },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("query", message);
      formData.append("uid", currentUser.uid);
      const response = await fetch("http://127.0.0.1:8000/query", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Query failed");
      const data = await response.json();

      const modelMessage = {
        type: "model",
        text: data.error ? `Error: ${data.error}` : data.response,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, "users", currentUser.uid, "files", activeFile.id, "chats"), modelMessage);
    } catch (error) {
      console.error("Query error:", error);
      const errorMessage = {
        type: "model",
        text: "Error: Failed to connect to server.",
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, "users", currentUser.uid, "files", activeFile.id, "chats"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar
        open={sidebarOpen}
        toggleSidebar={toggleSidebar}
        uid={currentUser?.uid}
        onSelectPdf={handleSelectPdf}
        onNewChat={handleNewChat}
      />
      {isMobile && sidebarOpen && <div style={styles.backdrop} onClick={toggleSidebar} />}

      <div
        style={{
          ...styles.content,
          transform: !isMobile && sidebarOpen ? "translateX(50px)" : "translateX(0)",
          transition: "transform",
        }}
      >
        {!activeFile && !isUploading && (
          <div style={styles.centerContent}>
            <UploadSection onOpenSidebar={toggleSidebar} onUploadPdf={handlePdfUpload} />
          </div>
        )}

        {!activeFile && isUploading && (
          <div style={styles.centerContent}>
            <img src={loadingGif} alt="Loading..." style={styles.loadingGif} />
          </div>
        )}

        {activeFile && (
          <div
            style={{
              ...styles.chatArea,
              top: isMobile ? "60px" : "0",
              bottom: `${chatInputHeight + 20}px`,
              scrollbarWidth: "none",
              "::-webkit-scrollbar": { display: "none" },
            }}
            ref={chatAreaRef}
          >
            <div style={styles.chatContent}>
              <div style={styles.messagesWrapper}>
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      ...(msg.type === "user" ? styles.userMessage : styles.modelMessage),
                      animation: "slideUp 0.3s ease-out",
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {isLoading && (
                  <div style={{ ...styles.loading, animation: "slideUp 0.3s ease-out" }}>
                    <img src={typingGif} alt="Typing..." style={styles.typingGif} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          ref={chatWrapperRef}
          style={{
            ...styles.chatWrapper,
            ...(isMobile
              ? {
                  left: "0",
                  right: "0",
                  width: "100%",
                  maxWidth: "none",
                  padding: "0 5%",
                  transform: "none",
                }
              : {
                  left: "50%",
                  width: "90%",
                  maxWidth: "800px",
                  transform: "translateX(-50%)",
                }),
          }}
        >
          <ChatInput
            disabled={!activeFile || isLoading}
            uid={currentUser?.uid}
            onSend={handleSendMessage}
          />
        </div>
      </div>
      <SidebarToggleButton toggleSidebar={toggleSidebar} />
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
    background: "linear-gradient(135deg, #1a1a1a, #121212)",
    backgroundImage: "radial-gradient(circle at center, rgba(0, 123, 255, 0.3), transparent 70%)",
    boxSizing: "border-box",
  },
  content: {
    position: "absolute",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
  },
  centerContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "800px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
  },
  chatWrapper: {
    position: "absolute",
    bottom: "20px",
    color: "#fff",
    textAlign: "center",
    boxSizing: "border-box",
  },
  chatArea: {
    position: "absolute",
    left: 0,
    right: 0,
    overflowY: "auto",
    overflowX: "hidden",
    zIndex: 1,
    transition: "bottom 0.3s ease",
    boxSizing: "border-box",
  },
  chatContent: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "10px",
    color: "#fff",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  messagesWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  userMessage: {
    background: "rgba(0, 123, 255, 0.7)",
    borderRadius: "10px",
    padding: "10px",
    marginBottom: "20px",
    margin: "5px 0",
    maxWidth: "70%",
    alignSelf: "flex-end",
    float: "right",
    clear: "both",
    boxSizing: "border-box",
  },
  modelMessage: {
    padding: "10px",
    margin: "5px 0 5px 0px",
    marginBottom: "25px",
    maxWidth: "100%",
    alignSelf: "flex-start",
    clear: "both",
    boxSizing: "border-box",
  },
  loading: {
    padding: "10px",
    margin: "5px 0 5px 20px",
    color: "#888",
    display: "flex",
    alignItems: "center",
    maxWidth: "70%",
    alignSelf: "flex-start",
    clear: "both",
    boxSizing: "border-box",
  },
  spinner: { // Kept for reference, but no longer used
    width: "20px",
    height: "20px",
    border: "3px solid #888",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingGif: {
    width: "100px",
    height: "100px",
  },
  typingGif: {
    width: "50px", // Adjusted size for chat area, tweak as needed
    height: "50px",
    padding: "0px",
    margin: "0px",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 998,
    boxSizing: "border-box",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default MainPage;