import { Link } from 'react-router-dom'
import { useState } from 'react'
import './sidebar.css'

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
          </ul>
        </nav>
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