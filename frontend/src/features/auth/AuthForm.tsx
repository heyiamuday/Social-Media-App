// AuthForm.tsx
import { useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import './AuthForm.css'

const SIGNUP_MUTATION = gql`
  mutation Signup($name: String!, $username: String!, $email: String!, $password: String!) { # Added username
    signup(name: $name, username: $username, email: $email, password: $password) { # Added username
      token
      user {
        id
        name
        username # Ensure you fetch username here if you need it on the client
        email
      }
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($loginIdentifier: String!, $password: String!) {
    login(loginIdentifier: $loginIdentifier, password: $password) {
      token
      user {
        id
        name
        username
        email
      }
    }
  }
`;

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('') // Added username state
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [mutate, { loading }] = useMutation(
    isLogin ? LOGIN_MUTATION : SIGNUP_MUTATION,
    {
      onCompleted: (data) => {
        localStorage.setItem('token', data.login?.token || data.signup?.token) // Adjusted for optional chaining
        navigate('/')
      },
      onError: (err) => setError(err.message)
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const variables = isLogin
      ? { loginIdentifier, password }
      : { name, username, email, password } // Added username to variables

    mutate({ variables })
  }

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error">{error}</div>}

      {isLogin && (
       <div className="form-group">
        <label>Email or Username</label>
        <input
            type="text"
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            required
         />
       </div>
      )}

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

        {!isLogin && (
           <div className="form-group">
           <label>Email</label>
           <input
             type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
           />
         </div>

        )}
       {!isLogin && (
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
       )}
       

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
      
        {!isLogin && (
          <div className="form-group">
         <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
          </div>
        )}

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