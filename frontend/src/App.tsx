//frontend/src/App.tsx
import { Routes, Route, BrowserRouter, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import AuthForm from './features/auth/AuthForm.tsx';
import Home from './features/user/Home.tsx';
import Profile from './features/user/Profile.tsx';
import EditProfileModal from './features/user/EditProfileModal.tsx';
import CreatePost from './features/post/CreatePost.tsx';


// Import FontAwesome icons if you haven't already
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faPlusSquare, faUser } from '@fortawesome/free-solid-svg-icons';

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  return (
      <div className="bg-gray-50 min-h-screen font-sans">
        {/* Navigation Bar */}
        {isAuthenticated && ( // Only show nav if authenticated
          <nav className="bg-white border-b border-gray-300 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4"> {/* Adjusted max-width */}
              <div className="flex items-center justify-between h-14"> {/* Adjusted height */}
                {/* Logo */}
                <div className="flex-shrink-0">
                  <Link to="/" className="text-2xl font-semibold font-['Style_Script'] tracking-wider text-black"> {/* Instagram-like font */}
                  SecretTalks
                  </Link>
                </div>

                {/* Search Bar (Not working future-planning) */}
                <div className="hidden md:block">
                  <input
                    type="text"
                    placeholder="Search"
                    className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                {/* Icons */}
                <div className="flex items-center space-x-5"> {/* Adjusted spacing */}
                  <Link to="/" className="text-gray-700 hover:text-black">
                    <FontAwesomeIcon icon={faHome} size="lg" />
                  </Link>
                  <Link to="/create-post" className="text-gray-700 hover:text-black">
                    <FontAwesomeIcon icon={faPlusSquare} size="lg" />
                  </Link>
                  <Link to="/profile" className="text-gray-700 hover:text-black">
                     {/* Replace with user avatar later */}
                     <FontAwesomeIcon icon={faUser} size="lg" />
                  </Link>
                  <button onClick={logout} className="text-gray-700 hover:text-black text-sm font-medium">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Main Content Area */}
        <main className="py-8"> {/* Adjusted padding */}
          {/* Center content similar to Instagram */}
          <div className="max-w-4xl mx-auto px-4">
            <Routes>
              {/* Redirect to auth if not logged in */}
              <Route path="/" element={isAuthenticated ? <Home /> : <AuthForm />} />
              <Route path="/auth" element={<AuthForm />} />
               {/* Protected Routes */}
              <Route path="/profile/edit" element={isAuthenticated ? <EditProfileModal onClose={() => { /* Need a proper close handler */ }} /> : <AuthForm />} />
              <Route path="/user/:username" element={isAuthenticated ? <Profile /> : <AuthForm />} />
              <Route path="/profile" element={isAuthenticated ? <Profile /> : <AuthForm />} />
              <Route path="/create-post" element={isAuthenticated ? <CreatePost /> : <AuthForm />} />
            </Routes>
          </div>
        </main>
      </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;