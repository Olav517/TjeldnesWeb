import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/home'
import About from './pages/about'
import Sidebar from './components/sidebar'
import Resume from './pages/resume'
import Hangman from './pages/hangman'
import Crossword from './pages/crossword'
import TicTacToe from './pages/tictactoe'
import './App.css'
import { useAuth } from "react-oidc-context";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "1q6dmagqniqskhlhcdp41ermtt";
    const logoutUri = window.location.origin + "/";
    const cognitoDomain = "https://tjeldnes-web-webapp.auth.eu-central-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            {auth.isLoading ? (
              <span>Loading authentication...</span>
            ) : auth.isAuthenticated ? (
              <>
                <span>Hello, {auth.user?.profile.email} </span>
                <button style={{ marginLeft: 8 }} onClick={signOutRedirect}>Sign out</button>
              </>
            ) : (
              <button onClick={() => auth.signinRedirect()}>Sign in</button>
            )}
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/hangman" element={<Hangman />} />
            <Route path="/crossword" element={
              <ProtectedRoute>
                <Crossword />
              </ProtectedRoute>
            } />
            <Route path="/tictactoe" element={
              <ProtectedRoute>
                <TicTacToe />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App
/* afs */