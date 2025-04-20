import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

const SIGNUP_MUTATION = gql`
  mutation Signup($name: String!, $username: String!, $email: String!, $password: String!) {
    signup(name: $name, username: $username, email: $email, password: $password) {
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
  const [isLogin, setIsLogin] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [mutate, { loading }] = useMutation(
    isLogin ? LOGIN_MUTATION : SIGNUP_MUTATION,
    {
      onCompleted: (data) => {
        // Check if we actually got a token back
        const token = data.login?.token || data.signup?.token;
        if (!token) {
          setError('Authentication failed: No token received');
          return;
        }
        
        localStorage.setItem('token', token);
        console.log('Authentication successful. Token stored.');
        navigate('/');
      },
      onError: (err) => {
        console.error('Authentication error:', err);
        // Extract the specific error message from the GraphQL error if possible
        const graphQLErrors = err.graphQLErrors || [];
        if (graphQLErrors.length > 0) {
          setError(graphQLErrors[0].message || 'Authentication failed');
        } else if (err.networkError) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(err.message || 'Authentication failed');
        }
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const variables = isLogin
      ? { loginIdentifier, password }
      : { name, username, email, password };

    console.log(`Attempting to ${isLogin ? 'login' : 'signup'} with:`, 
      isLogin ? { loginIdentifier } : { username, email });
    
    mutate({ variables });
  };

  const inputStyle = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
  const labelStyle = "block mb-1 text-sm font-medium text-gray-900";
  const buttonStyle = "w-full text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-md p-6 md:p-8 mb-4">
        <h1 className="text-3xl font-semibold font-['Style_Script'] tracking-wider text-black text-center mb-6">
          Secret Talks
        </h1>
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="email" className={labelStyle}>Your email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} placeholder="name@company.com" required />
            </div>
          )}
          {!isLogin && (
            <div>
              <label htmlFor="name" className={labelStyle}>Full Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} placeholder="John Doe" required />
            </div>
          )}
          {isLogin ? (
            <div>
              <label htmlFor="loginIdentifier" className={labelStyle}>Username or Email</label>
              <input type="text" id="loginIdentifier" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className={inputStyle} placeholder="username or name@company.com" required />
            </div>
          ) : (
             <div>
              <label htmlFor="username" className={labelStyle}>Username</label>
              <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputStyle} placeholder="johndoe" required />
            </div>
          )}
          <div>
            <label htmlFor="password" className={labelStyle}>Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputStyle} minLength={6} required />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className={labelStyle}>Confirm password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputStyle} minLength={6} required />
            </div>
          )}
          <button type="submit" disabled={loading} className={buttonStyle}>
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign up'}
          </button>
        </form>
      </div>

      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-md p-4 text-center">
        <p className="text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : 'Have an account?'}{' '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="font-medium text-blue-600 hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}