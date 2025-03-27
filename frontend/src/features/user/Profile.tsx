import { useQuery, gql } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react'; // Import useEffect

const GET_PROFILE = gql`
  query GetProfile {
    me {
      id
      name
      username
      email
      posts {
        id
        title
      }
    }
  }
`;

export default function Profile() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_PROFILE);

  useEffect(() => {
    if (error) {
      localStorage.removeItem('token');
      navigate('/auth');
    }
  }, [error, navigate]); // Add error and navigate as dependencies

  if (loading) return <div>Loading...</div>;
  if (!data) return null; //prevent trying to access data before it is available.

  return (
    <div className="profile-container">
      <Link to = '/' >Home</Link>
      <h1>{data.me.name}'s Profile</h1>
      <div className="profile-info">
        <p>Username: {`@${data.me.username}`}</p>
        <p>Email: {data.me.email}</p>
        <h3>Posts ({data.me.posts.length})</h3>
        <ul className="posts-list">
          {data.me.posts.map((post: any) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}