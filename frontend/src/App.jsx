import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig.jsx";
import AuthPage from "./authentication/Authpage.jsx";
import MainPage from "./pages/MainPage.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div style={{ background: "#000", height: "100vh" }} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/authpage" element={!user ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <MainPage /> : <Navigate to="/authpage" />} />
        <Route path="/chat/:fileId" element={user ? <MainPage /> : <Navigate to="/authpage" />} />
      </Routes>
    </Router>
  );
}

export default App;