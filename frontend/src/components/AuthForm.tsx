import { useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import './AuthForm.css'


const SIGNUP_MUTATION = gql`
  mutation Signup($name: String!, $email: String!, $password: String!) {
    signup(name: $name, email: $email, password: $password)
  }
`

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [mutate, { loading }] = useMutation(
    isLogin ? LOGIN_MUTATION : SIGNUP_MUTATION,
    {
      onCompleted: (data) => {
        localStorage.setItem('token', data.login || data.signup)
        navigate('/')
      },
      onError: (err) => setError(err.message)
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const variables = isLogin 
      ? { email, password }
      : { name, email, password }

    mutate({ variables })
  }

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
        </button>
      </form>

      <button 
        className="toggle-mode" 
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin 
          ? "Don't have an account? Sign Up" 
          : "Already have an account? Login"}
      </button>
    </div>
  )
}