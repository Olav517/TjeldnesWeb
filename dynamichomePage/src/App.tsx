import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import About from './pages/about'
import Sidebar from './components/sidebar'
import Resume from './pages/resume'
import Hangman from './pages/hangman'
import Crossword from './pages/crossword'
import TicTacToe from './pages/tictactoe'
import './App.css'
import { RequireAuth } from './RequireAuth';
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

function App() {
  return (
    <Authenticator.Provider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/hangman" element={<Hangman />} />
              <Route path="/crossword" element={
                <RequireAuth>
                  <Crossword />
                </RequireAuth>
              } />
              <Route path="/tictactoe" element={
                <RequireAuth>
                  <TicTacToe />
                </RequireAuth>
              } />
              <Route path="/login" element={<Authenticator />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Authenticator.Provider>
  )
}

export default App
/* afs */