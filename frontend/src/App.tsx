import { Routes, Route, BrowserRouter, Link } from 'react-router-dom';
import AuthForm from './features/auth/AuthForm.tsx';
import Home from './features/user/Home.tsx';
import Profile from './features/user/Profile.tsx';
import EditProfile from './features/user/EditProfile.tsx';
import CreatePost from './features/post/CreatePost.tsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-100 min-h-screen font-sans">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-indigo-600">
                  SocialApp
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-700 hover:text-indigo-600">
                  Profile
                </Link>
                <Link to="/create-post" className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  Create Post
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthForm />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-post" element={<CreatePost />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;