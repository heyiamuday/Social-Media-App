// src/components/HomePage.tsx
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
// Import the custom Sass file for additional styling
// import '../../styles/components/home.scss';
import '../../styles/components/home.scss';

const GET_ALL_POSTS = gql`
  query GetAllPosts {
    allPosts {
      id
      imageUrl
      caption
      createdAt
      author {
        id
        username
      }
    }
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_ALL_POSTS);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/auth');
    }
  }, [navigate]);

  if (loading)
    return <div className="text-center py-8">Loading posts...</div>;
  if (error)
    return (
      <div className="text-center py-8 text-red-500">
        Error loading posts: {error.message}
      </div>
    );

  return (
    <div className="home-container">
      {/* Logout Button */}
      <button
        onClick={() => {
          localStorage.removeItem('token');
          navigate('/auth');
        }}
        className="logout-btn"
      >
        Logout
      </button>

      {/* Post Grid */}
      <div className="post-grid">
        {data?.allPosts?.map((post: any) => (
          <div key={post.id} className="post-card">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <strong className="text-gray-800 font-semibold">
                    {post.author.username}
                  </strong>
                  <small className="text-gray-500 text-sm ml-2">
                    {new Date(post.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-auto rounded-md"
              />
              {post.caption && (
                <p className="text-gray-700 mt-2">{post.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <Link to="/create-post" className="fab-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </Link>
    </div>
  );
}
