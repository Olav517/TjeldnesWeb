import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import About from './pages/about'
import Sidebar from './components/sidebar'
import Resume from './pages/resume'
import Hangman from './pages/hangman'
import Crossword from './pages/crossword'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/hangman" element={<Hangman />} />
            <Route path="/crossword" element={<Crossword />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
/* afs */