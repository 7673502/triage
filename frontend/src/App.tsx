import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import ComplaintCard from './components/ComplaintCard';

function App() {
  const [count, setCount] = useState(0)

  return <div>
    <ComplaintCard />
    <ComplaintCard />
    <ComplaintCard />
    </div>

}

export default App
