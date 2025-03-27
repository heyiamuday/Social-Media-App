import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/auth');
    }
  }, []);

  return (
    <div className="home-container">
      <h1>Welcome to Social Media App</h1>
      <nav>
        <Link to="/profile">My Profile</Link>
        {/* <Link to="/auth">Login/Signup</Link> */}
      </nav>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          navigate('/auth');
        }}
      >
        Logout
      </button>
    </div>
  );
}