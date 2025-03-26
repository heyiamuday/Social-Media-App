import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import Home from './components/Home.tsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthForm />} />
      </Routes>
    </Router>
  )
}

export default App