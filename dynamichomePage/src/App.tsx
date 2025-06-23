import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import About from './pages/about'
import Sidebar from './components/sidebar'
import Resume from './pages/resume'
import Hangman from './pages/hangman'
import Crossword from './pages/crossword'
import TicTacToe from './pages/tictactoe'
import './App.css'
import { useAuth } from "react-oidc-context";
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  useAuth();

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/resume" element={
              <ProtectedRoute>
                <Resume />
              </ProtectedRoute>
              } />
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