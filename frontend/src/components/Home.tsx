import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/auth')
    }
  }, [])

  return (
    <div>
      <h1>Welcome to Social Media App</h1>
      <button onClick={() => {
        localStorage.removeItem('token')
        navigate('/auth')
      }}>
        Logout
      </button>
    </div>
  )
}