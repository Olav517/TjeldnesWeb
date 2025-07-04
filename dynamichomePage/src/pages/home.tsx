import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import VisitorCounter from "../components/visitorcounter"

const viteLogo = '/vite.svg'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Click count is {count}
        </button>
        <div id="Visitor-count"> 
          <VisitorCounter />
        </div>
      </div>
    </>
  )
}
// afs

export default Home