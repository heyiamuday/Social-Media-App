// src/components/HomePage.tsx
import { useNavigate } from 'react-router-dom';
import { useQuery, gql, useApolloClient } from '@apollo/client';
import PostCard from "../post/PostCard";
import { useAuth } from '../../context/AuthContext';

const GET_ALL_POSTS = gql`
  query GetAllPosts {
    allPosts {
      id
      imageUrl
      caption
      createdAt
      likeCount
      likedByCurrentUser
      author {
        id
        username
        avatarUrl
      }
    }
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const client = useApolloClient();
  const { loading, error, data } = useQuery(GET_ALL_POSTS);

  const handleLogout = () => {
    logout(); // Centralized logic from AuthContext to remove token and update state
    // Reset Apollo cache to clear all user-specific data
    client.resetStore().then(() => {
      // Navigate to the login page after cache is cleared
      navigate('/auth');
    });
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Error loading posts: {error.message}</div>;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        {data?.allPosts?.length > 0 ? (
          data.allPosts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            No posts yet. Follow some users or create your first post!
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg z-50"
      >
        Logout
      </button>
    </div>
  );
}
