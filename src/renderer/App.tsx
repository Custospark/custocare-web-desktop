import { useState } from 'react'
import reactLogo from '/assets/vite.svg'
import './App.css'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className='text-yellow-500' >Vite + React+Tailwind css</h1>
      <p className='bg-blue-500'>Okay</p>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count  {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p className="text-blue-600">Good to go now.</p>
    </>
  )
}

export default App
