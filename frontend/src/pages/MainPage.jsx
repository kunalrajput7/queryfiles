// src/pages/MainPage.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import UploadSection from "../components/UploadSection";
import Sidebar from "../components/Sidebar";
import ChatInput from "../components/ChatInput";
import SidebarToggleButton from "../components/SidebarToggleButton";

// A simple hook to detect mobile mode based on window width
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

const MainPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const isMobile = useMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Dummy handler for PDF upload; integrate real logic later
  const handlePdfUpload = () => {
    setPdfUploaded(true);
  };

  return (
    <div style={styles.container}>
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* In mobile mode, display a backdrop overlay when the sidebar is open */}
      {isMobile && sidebarOpen && (
        <div style={styles.backdrop} onClick={toggleSidebar} />
      )}
      
      <div
        style={{
          ...styles.content,
          // Only slide main content for desktop mode, but only slightly (50px)
          transform: !isMobile && sidebarOpen ? "translateX(50px)" : "translateX(0)",
          transition: "transform 0.3s ease",
        }}
      >
        <div style={styles.centerContent}>
          <UploadSection onOpenSidebar={toggleSidebar} onUploadPdf={handlePdfUpload} />
        </div>
        <div style={styles.chatWrapper}>
          <ChatInput disabled={!pdfUploaded} />
        </div>
      </div>
      
      {/* SidebarToggleButton appears only on desktop (handled in its component) */}
      <SidebarToggleButton toggleSidebar={toggleSidebar} />
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden", // Prevent scrolling
    background: "linear-gradient(135deg, #1a1a1a, #121212)",
    backgroundImage: "radial-gradient(circle at center, rgba(0, 123, 255, 0.3), transparent 70%)",
  },
  content: {
    position: "absolute",
    width: "100%",
    height: "100%",
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
  },
  chatWrapper: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "800px",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 998, // Ensure it's below the sidebar (which has zIndex 999)
  },
};

export default MainPage;
