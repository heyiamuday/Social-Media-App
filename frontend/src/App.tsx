import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthForm from './features/auth/AuthForm.tsx'
import Home from './features/user/Home.tsx'
import Profile from './features/user/Profile.tsx'



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}

export default App