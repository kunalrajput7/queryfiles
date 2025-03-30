// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "/src/firebaseConfig";
import Login from "/src/authentication/Login";
import Signup from "/src/authentication/Signup";
import MainPage from "/src/pages/MainPage";
import AuthPage from "./authentication/authpage";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  return (
    <Router>
      <Routes>
        {/* <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} /> */}
        {/* <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} /> */}
        <Route path="/authpage" element={!user ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <MainPage /> : <Navigate to="/authpage" />} />
      </Routes>
    </Router>
  );
}

export default App;
