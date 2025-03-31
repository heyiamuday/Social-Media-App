          import { useState } from 'react';
          import { useQuery, gql, useMutation } from '@apollo/client';
          import { Link, useNavigate } from 'react-router-dom';
          import { useEffect } from 'react'; 
          import EditProfile from './EditProfile'; 
          import '../../styles/components/profile.scss';
          
          const GET_PROFILE = gql`
            query GetProfile {
              me {
                id
                name
                username
                email
                bio
                posts {
                  id
                  caption
                  imageUrl 
                }
              }
            }
          `;


const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      success
      message
    }
  }
`;



export default function Profile() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_PROFILE);
  // const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [deletePost] = useMutation(DELETE_POST, {
    update(cache, { data: { deletePost } } ) {
      // read query
      const existPostQuery = gql`
      query GetPosts {
        posts {
          id
        }
      }`;
      //read post on cache
      const existPostQueryData = cache.readQuery({ query: existPostQuery});

      //if the data exist delete it
      if (existPostQuery && existPostQueryData ) {
        const updatePosts = existPostQueryData.posts.filter(
          (post) => post.id !== deletePost?.id
        )
        // Write the updated list of posts back to the cache
        cache.writeQuery({
          query: existPostQuery,
          data: {posts: updatePosts},
        });
      }

    },
    onError(error) {
      console.error("Error delete post", error)
    }
  })

  useEffect(() => {
    if (error) {
      localStorage.removeItem('token');
      navigate('/auth');
    }
  }, [error, navigate]);

  if (loading) return <div className="text-center py-8">Loading profile...</div>;
  if (!data?.me) return <div className="text-center py-8">Profile not found.</div>;

  const { name, username, email, bio, posts } = data.me;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-indigo-600 hover:underline">&larr; Home</Link>
            <button> <Link to="/profile/edit"  className="bg-white-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline" >Profile Edit  </Link>
            </button>
          </div>
          <div className="mt-6 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
              {name && name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
              <p className="text-gray-600">@{username}</p>
            </div>
          </div>
          <p className="text-gray-700 mt-2">{bio || 'No bio provided.'}</p>
          <p className="text-gray-700 mt-1 text-sm">Email: {email}</p>
        </div>

        {/* Posts Section */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Posts ({posts.length})</h3>
          {posts.length > 0 ? (
            <div className="post-grid">
              {posts.map((post) => (
                <div key={post.id} className="post-card">

                  <div >
                    {/* Delete post button */}
                  <button onClick={() => deletePost({ variables: { id: post.id }})} > 
                    &times; 
                 </button>
                  </div>

                  {post.imageUrl ? (
                    <img 
                    src={post.imageUrl} 
                    alt={post.caption} 
                    className="w-full h-auto rounded-md mb-2"  
                    />
                  ) : null } 
                  {post.caption && (
                    <p className="text-gray-700 mt-2">{post.caption}</p>
                  )}

                    <div>
                      
                    </div>
                </div>
              ))}
            </div>
            
          ) : (
            <p className="text-gray-500">No posts yet.</p>
          )}

        </div>
      </div>

      {/* Edit Profile Popup */}
      {/* {isEditProfileOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6 max-w-md w-full">
            <EditProfile onClose={() => setIsEditProfileOpen(false)} />
          </div>
        </div>
      )} */}
    </div>
  );
}


