  //frontend/src/features/user/Profile.tsx
  import { useState, useEffect } from 'react';
          import { useQuery, gql, useMutation, ApolloError } from '@apollo/client';
          import { Link, useNavigate, useParams } from 'react-router-dom';
          
          import EditProfileModal from './EditProfileModal'; 
          import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
          import { faCog, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
          import { Avatar } from '../post/PostCard'; // Import the Avatar component
          
          // Define TypeScript types for the query response
          interface Post {
            id: string;
            caption?: string | null;
            imageUrl: string;
          }

          interface UserProfile {
            id: string;
            name: string;
            username: string;
            email: string; // Consider if email should be public
            bio?: string | null;
            avatarUrl?: string; // Add avatarUrl to user profile
            posts: Post[];
          }

          interface GetProfileQueryResponse {
            // Corresponds to the 'me' or 'userByUsername' query
            profileData: UserProfile | null;
          }

          interface GetProfileQueryVars {
            username?: string; // Make username optional
          }

          // Updated GraphQL Query to fetch profile by username OR the logged-in user
          // We will use a single query name on the client, but map it to different
          // backend queries based on whether 'username' variable is provided.
          // Let's call the *backend* query 'userProfile' for flexibility.
          const GET_PROFILE_QUERY = gql`
            query GetUserProfile($username: String) {
              # Alias the backend query based on whether username is provided
              # The actual backend query names are 'userByUsername' and 'me'
              profileData: userProfile(username: $username) {
                id
                name
                username
                email # Review: Should email be fetched for other users?
                bio
                avatarUrl
                posts {
                  id
                  caption
                  imageUrl
                }
              }
            }
          `;

          const DELETE_POST = gql`
            # Assume mutation returns the ID of the deleted post for cache update
            mutation DeletePost($id: ID!) {
              deletePost(id: $id) {
                success
                message
                deletedId: id # Assuming the backend returns the deleted ID
              }
            }
          `;

          export default function Profile() {
            const navigate = useNavigate();
            const { username: usernameFromParams } = useParams<{ username: string }>(); // Get username from URL
            const [isEditModalOpen, setIsEditModalOpen] = useState(false);
            const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null); // To store logged-in user's username

            const { loading, error, data, refetch } = useQuery<GetProfileQueryResponse, GetProfileQueryVars>(
              GET_PROFILE_QUERY,
              {
                variables: { username: usernameFromParams }, // Pass username from URL, will be undefined for /profile
                fetchPolicy: 'cache-and-network',
                // If usernameFromParams is undefined, the resolver should fetch the logged-in user ('me')
                // Notify on network status change can be useful for loading indicators
                notifyOnNetworkStatusChange: true,
              }
            );

            // Determine if viewing own profile AFTER data loads
            const profileData = data?.profileData;
            // We need a reliable way to know the logged-in user's ID or username.
            // Let's assume we fetch the logged-in user's ID separately or get it from context.
            // const loggedInUserId = getLoggedInUserIdFromContext(); // Placeholder
            // const isOwnProfile = profileData && profileData.id === loggedInUserId;
            // OR if the backend 'me' query returns the same structure:
            const isOwnProfile = !usernameFromParams && !!profileData; // True if navigated via /profile and data loaded

            const [deletePostMutation] = useMutation(DELETE_POST, {
                // Update cache logic needs refinement based on the new query structure
                update(cache, { data: { deletePost: deletedPostData } }) {
                    if (!deletedPostData || !deletedPostData.success) return;

                    // Read the correct query (GET_PROFILE_QUERY) with the right variables
                    const currentVars = { username: usernameFromParams };
                    const existingProfileData = cache.readQuery<GetProfileQueryResponse, GetProfileQueryVars>({
                        query: GET_PROFILE_QUERY,
                        variables: currentVars,
                    });

                    if (existingProfileData?.profileData?.posts) {
                        const updatedPosts = existingProfileData.profileData.posts.filter(
                            (post: Post) => post.id !== deletedPostData.deletedId // Assume mutation returns deletedId
                        );
                        cache.writeQuery<GetProfileQueryResponse, GetProfileQueryVars>({
                            query: GET_PROFILE_QUERY,
                            variables: currentVars,
                            data: {
                                ...existingProfileData,
                                profileData: {
                                   ...existingProfileData.profileData,
                                   posts: updatedPosts
                                },
                            },
                        });
                    }
                },
            onError(err) {
              console.error("Error deleting post:", err);
              // Add user feedback (e.g., toast notification)
            }
          });

            useEffect(() => {
                // Handle auth error specifically when fetching own profile
                if (error && !usernameFromParams) {
                    console.error("Error fetching own profile:", error);
                    // Check if it's an authentication error
                    if (error.message.includes('Not authenticated') || (error as ApolloError).graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
                       localStorage.removeItem('token');
                       navigate('/auth');
                    }
                }
                // Refetch profile data if the username parameter changes
                refetch({ username: usernameFromParams });

            }, [error, usernameFromParams, navigate, refetch]);

            const handlePostDelete = (postId: string) => {
              if (window.confirm('Are you sure you want to delete this post?')) {
                deletePostMutation({ variables: { id: postId } });
              }
            };

            if (loading) return <div className="text-center py-10">Loading profile...</div>;
            if (error) {
                // Differentiate error messages based on context
                if (!usernameFromParams) {
                     // Error fetching own profile
                     return <div className="text-center py-10 text-red-600">Could not load your profile. Please try logging in again or refresh the page.</div>;
                } else {
                    // Error fetching someone else's profile
                    return <div className="text-center py-10 text-red-600">Could not load profile for @{usernameFromParams}. User may not exist or there was a network issue.</div>;
                }
            }
            // If no error, but data is missing (e.g., user not found by username)
            if (!profileData) {
                if (usernameFromParams) {
                     return <div className="text-center py-10">User @{usernameFromParams} not found.</div>;
                } else {
                    // This case might indicate an issue fetching the logged-in user
                    return <div className="text-center py-10">Could not load profile data.</div>;
                }
            }

            // Destructure data AFTER checking profileData exists
            const { id: userId, name, username, bio, avatarUrl, posts } = profileData;

            return (
              <div className="profile-container max-w-4xl mx-auto">
                {/* Profile Header */}
                <header className="flex items-start p-4 md:p-8 border-b border-gray-300 mb-8">
                  {/* Avatar - Larger on Medium screens */}
                  <div className="w-20 h-20 md:w-36 md:h-36 rounded-full overflow-hidden mr-6 md:mr-16 flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`${username}'s avatar`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-4xl md:text-6xl">
                        {username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Profile Info Section */}
                  <div className="flex-grow mt-2 md:mt-4">
                    <div className="flex items-center mb-3 md:mb-4">
                      <h1 className="text-xl md:text-2xl font-light text-gray-800 mr-4">{username}</h1>
                      {/* Conditional Buttons: Edit/Settings for own profile, Follow for others */}
                      {isOwnProfile ? (
                        <>
                          <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="border border-gray-300 rounded px-3 py-1 text-sm font-semibold mr-3 hover:bg-gray-50"
                          >
                            Edit Profile
                          </button>
                          {/* Optional Settings Button */}
                          <button className="text-gray-700 hover:text-black">
                            <FontAwesomeIcon icon={faCog} size="lg" />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Follow button would go here */}
                          <button className="bg-blue-500 text-white rounded px-3 py-1 text-sm font-semibold hover:bg-blue-600">
                            Follow
                          </button>
                        </>
                      )}
                    </div>

                    {/* Profile Stats */}
                    <div className="flex mb-4">
                      <div className="mr-6">
                        <span className="font-semibold">{posts.length}</span> {posts.length === 1 ? 'post' : 'posts'}
                      </div>
                      {/* Placeholder stats - replace with real data later */}
                      <div className="mr-6">
                        <span className="font-semibold">--</span> followers
                      </div>
                      <div>
                        <span className="font-semibold">--</span> following
                      </div>
                    </div>

                    {/* Profile Bio */}
                    <div className="text-gray-900">
                      <p className="font-semibold">{name}</p>
                      {bio && <p className="mt-1 whitespace-pre-wrap">{bio}</p>}
                    </div>
                  </div>
                </header>

                {/* Create Post Button (only on own profile) */}
                {isOwnProfile && (
                  <div className="mb-6 text-center">
                    <Link
                      to="/create-post"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <FontAwesomeIcon icon={faPlusSquare} className="mr-2" />
                      Create Post
                    </Link>
                  </div>
                )}

                {/* Post Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
                  {posts.length > 0 ? (
                    posts.map((post: Post) => (
                      <div key={post.id} className="aspect-square relative group overflow-hidden bg-gray-100">
                        <Link to={`/post/${post.id}`}>
                          <img
                            src={post.imageUrl}
                            alt={post.caption || 'Post'}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Overlay with actions on hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Post details overlay */}
                          </div>
                        </Link>
                        
                        {/* Delete button (only on own profile) */}
                        {isOwnProfile && (
                          <button
                            onClick={() => handlePostDelete(post.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                            aria-label="Delete post"
                          >
                            X
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 py-8 text-center text-gray-500">
                      {isOwnProfile
                        ? "You haven't shared any posts yet. Click 'Create Post' to get started!"
                        : `${username} hasn't shared any posts yet.`}
                    </div>
                  )}
                </div>

                {/* Edit Profile Modal */}
                {isEditModalOpen && <EditProfileModal onClose={() => setIsEditModalOpen(false)} />}
              </div>
            );
          }


