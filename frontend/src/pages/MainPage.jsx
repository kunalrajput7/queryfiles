import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig.jsx";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import Navbar from "../components/Navbar.jsx";
import UploadSection from "../components/UploadSection.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ChatInput from "../components/ChatInput.jsx";
import SidebarToggleButton from "../components/SidebarToggleButton.jsx";
import loadingGif from "../assets/response_loading.gif";
import typingGif from "../assets/typing.gif";
import pdfLogo from "../assets/pdf.png";
import wordLogo from "../assets/doc.png";
import excelLogo from "../assets/excel.png";

// Base URL for API calls (update for deployment)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const lastLoadedFileId = useRef(null);
  const [chatInputHeight, setChatInputHeight] = useState(46);
  const chatAreaRef = useRef(null);
  const chatWrapperRef = useRef(null);
  const pendingNavigation = useRef(null); // Track pending navigation
  const isMobile = useMobile();
  const { fileId } = useParams();
  const navigate = useNavigate();

  // Function to determine the file logo based on extension
  const getFileLogo = (filename) => {
    if (!filename) return pdfLogo; // Fallback to PDF logo
    const extension = filename.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return pdfLogo;
      case "doc":
      case "docx":
        return wordLogo;
      case "xls":
      case "xlsx":
        return excelLogo;
      default:
        return pdfLogo; // Default to PDF for unknown types
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsRestoring(false);
      return;
    }

    if (
      fileId &&
      lastLoadedFileId.current !== fileId &&
      !pendingNavigation.current
    ) {
      const fetchFile = async () => {
        try {
          const fileDoc = await getDoc(
            doc(db, "users", currentUser.uid, "files", fileId)
          );
          if (fileDoc.exists()) {
            const fileData = { id: fileDoc.id, ...fileDoc.data() };
            console.log(`useEffect: Loading file ${fileId}`);
            await handleSelectPdf(fileData, false);
          } else {
            console.log(`useEffect: File ${fileId} not found, redirecting`);
            navigate("/");
          }
        } catch (error) {
          console.error("useEffect: Error fetching file:", error);
          navigate("/");
        }
      };
      fetchFile();
    } else {
      setIsRestoring(false);
    }
  }, [currentUser, fileId, navigate]);

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

    const chatsRef = collection(
      db,
      "users",
      currentUser.uid,
      "files",
      activeFile.id,
      "chats"
    );
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
        setChatHistory([
          {
            type: "model",
            text: "Error loading chat history.",
            timestamp: new Date().toISOString(),
          },
        ]);
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
      const response = await fetch(`${API_BASE_URL}/upload_pdf`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Upload failed with status: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Upload response:", data);

      const uploadedFile = {
        id: data.id,
        filename: data.filename || file.name,
        upload_date: data.upload_date
          ? { toDate: () => new Date(data.upload_date) }
          : { toDate: () => new Date() },
      };

      await handleSelectPdf(uploadedFile);
    } catch (error) {
      console.error("Upload error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "model",
          text: `Error uploading file: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPdf = async (file, shouldNavigate = true) => {
    if (!currentUser?.uid) return;
    if (isLoadingFile || lastLoadedFileId.current === file.id) {
      console.log(
        `handleSelectPdf: Skipped for file ${file.id} (already loading or loaded)`
      );
      return;
    }
    setIsLoadingFile(true);
    console.log(`handleSelectPdf: Loading file ${file.id}`);
    const formData = new FormData();
    formData.append("uid", currentUser.uid);
    formData.append("fileid", file.id);
    try {
      if (shouldNavigate) {
        pendingNavigation.current = file.id; // Set pending navigation
        console.log(
          `handleSelectPdf: Setting pending navigation to ${file.id}`
        );
      }
      const response = await fetch(`${API_BASE_URL}/load_index`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            `Failed to load index with status: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Load index response:", data);
      if (!data.error) {
        setActiveFile(file);
        lastLoadedFileId.current = file.id;
        if (shouldNavigate) {
          console.log(`handleSelectPdf: Navigating to /chat/${file.id}`);
          navigate(`/chat/${file.id}`);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Load index error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "model",
          text: `Error loading file data: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      navigate("/");
    } finally {
      setIsLoadingFile(false);
      pendingNavigation.current = null; // Clear pending navigation
      setIsRestoring(false);
    }
  };

  const handleNewChat = () => {
    setActiveFile(null);
    lastLoadedFileId.current = null;
    navigate("/");
  };

  const handleSendMessage = async (message) => {
    if (!currentUser?.uid || !activeFile?.id) return;

    const userMessage = {
      type: "user",
      text: message,
      timestamp: new Date().toISOString(),
    };
    try {
      await addDoc(
        collection(
          db,
          "users",
          currentUser.uid,
          "files",
          activeFile.id,
          "chats"
        ),
        userMessage
      );
    } catch (error) {
      console.error("Error saving user message:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "model",
          text: "Error saving message.",
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("query", message);
      formData.append("uid", currentUser.uid);
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Query failed with status: ${response.status}`
        );
      }
      const data = await response.json();

      const modelMessage = {
        type: "model",
        text: data.error ? `Error: ${data.error}` : data.response,
        timestamp: new Date().toISOString(),
      };
      await addDoc(
        collection(
          db,
          "users",
          currentUser.uid,
          "files",
          activeFile.id,
          "chats"
        ),
        modelMessage
      );
    } catch (error) {
      console.error("Query error:", error);
      let errorText = "Error: Failed to connect to server.";
      if (error.message.includes("DeepSeek API error")) {
        // eslint-disable-next-line no-unused-vars
        errorText =
          "Error: API request limit reached or server issue. Please try again later.";
      }
      const errorMessage = {
        type: "model",
        text: "Error: Failed to connect to server.",
        timestamp: new Date().toISOString(),
      };
      await addDoc(
        collection(
          db,
          "users",
          currentUser.uid,
          "files",
          activeFile.id,
          "chats"
        ),
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isRestoring) {
    return (
      <div style={styles.centerContent}>
        <img src={loadingGif} alt="Loading..." style={styles.loadingGif} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar
        open={sidebarOpen}
        toggleSidebar={toggleSidebar}
        uid={currentUser?.uid}
        onSelectPdf={handleSelectPdf}
        onNewChat={handleNewChat}
        activeFile={activeFile}
      />
      {isMobile && sidebarOpen && (
        <div style={styles.backdrop} onClick={toggleSidebar} />
      )}

      <div
        style={{
          ...styles.content,
          transform:
            !isMobile && sidebarOpen ? "translateX(50px)" : "translateX(0)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {!activeFile && !isUploading && (
          <div style={styles.centerContent}>
            <UploadSection
              onOpenSidebar={toggleSidebar}
              onUploadPdf={handlePdfUpload}
            />
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
            }}
            ref={chatAreaRef}
          >
            <div style={styles.chatContent}>
              <div style={styles.messagesWrapper}>
                {chatHistory.length === 0 && !isLoading ? (
                  <div style={styles.fileWelcome}>
                    <img
                      src={getFileLogo(activeFile.filename)}
                      alt={`${activeFile.filename} icon`}
                      style={styles.fileLogo}
                    />
                    <p style={styles.fileMessage}>
                      "{activeFile.filename}" uploaded, ready for questions!
                    </p>
                  </div>
                ) : (
                  <>
                    {chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          ...(msg.type === "user"
                            ? styles.userMessage
                            : styles.modelMessage),
                          animation: "slideUp 0.3s ease-out",
                        }}
                      >
                        {msg.type === "model" ? (
                          <div style={styles.markdown}>
                            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div
                        style={{
                          ...styles.loading,
                          animation: "slideUp 0.3s ease-out",
                        }}
                      >
                        <img
                          src={typingGif}
                          alt="Typing..."
                          style={styles.typingGif}
                        />
                      </div>
                    )}
                  </>
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
    background: "rgba(24,24,25,255)",
    boxSizing: "border-box",
  },
  content: {
    position: "absolute",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    transition: "transform 0.3s ease-in-out",
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
  fileWelcome: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: "20px",
    color: "#fff",
  },
  fileLogo: {
    width: "64px",
    height: "64px",
    marginBottom: "15px",
  },
  fileMessage: {
    fontSize: "18px",
    fontWeight: "500",
    textAlign: "center",
    color: "#fff",
  },
  userMessage: {
    background: "rgba(255, 255, 255, 0.1)",
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
  markdown: {
    color: "#fff",
    lineHeight: "1.5",
    "& h1, & h2, & h3": {
      margin: "10px 0",
      fontWeight: "bold",
    },
    "& h1": {
      fontSize: "1.5em",
    },
    "& h2": {
      fontSize: "1.3em",
    },
    "& h3": {
      fontSize: "1.1em",
    },
    "& p": {
      margin: "8px 0",
    },
    "& ul, & ol": {
      margin: "8px 0",
      paddingLeft: "20px",
    },
    "& li": {
      margin: "4px 0",
    },
    "& strong": {
      fontWeight: "bold",
    },
    "& em": {
      fontStyle: "italic",
    },
    "& code": {
      background: "rgba(255, 255, 255, 0.1)",
      padding: "2px 4px",
      borderRadius: "4px",
      fontFamily: "monospace",
    },
    "& pre": {
      background: "rgba(255, 255, 255, 0.1)",
      padding: "10px",
      borderRadius: "4px",
      overflowX: "auto",
    },
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
  loadingGif: {
    width: "100px",
    height: "100px",
  },
  typingGif: {
    width: "50px",
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
