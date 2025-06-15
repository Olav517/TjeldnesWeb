import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
import './sidebar.css'

function LoginButton() {
  const { signOut, authStatus } = useAuthenticator();
  const navigate = useNavigate();

  if (authStatus === 'authenticated') {
    return <button className="sidebar-login-btn" onClick={signOut}>Sign Out</button>;
  }
  return <button className="sidebar-login-btn" onClick={() => navigate('/login')}>Sign In</button>;
}

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar">
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/resume">Resume</Link>
            </li>
            <li>
              <Link to="/hangman">Hangman Game</Link>
            </li>
            <li>
              <Link to="/crossword">Crossword Puzzle</Link>
            </li>
            <li>
              <Link to="/tictactoe">Tic Tac Toe</Link>
            </li>
          </ul>
        </nav>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <LoginButton />
        </div>
      </div>
      <button 
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '←' : '→'}
      </button>
    </div>
  )
}

export default Sidebar