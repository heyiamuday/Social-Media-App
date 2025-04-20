//frontend/src/features/post/CommentBox.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Avatar } from './PostCard'; // Import the Avatar component

// GraphQL query to fetch comments for a specific post
const GET_COMMENTS_BY_POST = gql`
  query GetCommentsByPost($postId: ID!) {
    CommentsByPost(postId: $postId) {
      id
      text
      createdAt
      updatedAt
      author {
        name
        username
        avatarUrl
      }
    }
  }
`;

// GraphQL mutation to add a new comment
const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $text: String!) {
    addComment(postId: $postId, text: $text) {
      id
      text
      createdAt
      updatedAt
      author {
        name
        username
        avatarUrl
      }
    }
  }
`;

interface CommentBoxProps {
  postId: number | string;
}

const CommentBox = ({ postId }: CommentBoxProps) => {
  const [commentText, setCommentText] = useState('');
  const postIdString = postId.toString();

  const { data, loading, error: loadError } = useQuery(GET_COMMENTS_BY_POST, {
    variables: { postId: postIdString },
    onError: (err) => {
      console.error("Error fetching comments (useQuery onError):", JSON.stringify(err, null, 2));
    }
  });

  const [addComment, { loading: addingComment, error: addCommentError }] = useMutation(ADD_COMMENT, {
    update(cache, { data: { addComment: newComment } }) {
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postIdString }),
        fields: {
        },
      });
    },
    refetchQueries: [{ query: GET_COMMENTS_BY_POST, variables: { postId: postIdString } }],
    onError: (err) => {
      console.error("Error adding comment (useMutation onError):", JSON.stringify(err, null, 2));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = commentText.trim();
    if (!trimmedText) return;

    try {
      await addComment({ variables: { postId: postIdString, text: trimmedText } });
      setCommentText('');
    } catch (err) {
      console.error('Error in handleSubmit trying to add comment:', JSON.stringify(err, null, 2));
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Loading comments...</p>;
  }
  if (loadError) {
    console.error("Error loading comments (render check):", JSON.stringify(loadError, null, 2));
    return <p className="text-center text-red-500">Error loading comments.</p>;
  }

  // Assuming the query returns data in data.commentsByPost based on common practices
  // We will verify this against the schema later
  const comments = data?.CommentsByPost || [];

  return (
    <div className="comment-section space-y-3">
      {/* Display existing comments */}
      <div className="comment-list px-4 space-y-2 max-h-40 overflow-y-auto">
        {comments.length > 0 ? (
          comments.map((comment: any) => {
            console.log(comment); // Log the comment object to inspect its structure
            const authorUsername = comment.author?.username || 'Unknown User';
            const authorAvatarUrl = comment.author?.avatarUrl; // Avatar component handles undefined
            const authorProfileLink = comment.author ? `/user/${comment.author.username}` : '#'; // Link to # if no author
            const isLinkDisabled = !comment.author; // Disable link interaction if no author

            return (
              <div key={comment.id} className="flex items-start space-x-2 py-1">
                {/* User Avatar - Link only active if author exists */}
                <Link 
                  to={authorProfileLink} 
                  className={`flex-shrink-0 ${isLinkDisabled ? 'pointer-events-none' : ''}`}
                  aria-disabled={isLinkDisabled}
                  tabIndex={isLinkDisabled ? -1 : undefined} // Improve accessibility for disabled link
                >
                  <Avatar avatarUrl={authorAvatarUrl} username={authorUsername} />
                </Link>
                
                <div className="flex-1">
                  <div className="text-sm">
                    {/* Author Username - Link only active if author exists */}
                    <Link 
                      to={authorProfileLink} 
                      className={`font-semibold mr-1 ${isLinkDisabled ? 'text-gray-500' : 'hover:underline'}`}
                      aria-disabled={isLinkDisabled}
                      tabIndex={isLinkDisabled ? -1 : undefined} // Improve accessibility for disabled link
                    >
                      {authorUsername}
                    </Link>
                    {/* Comment Text */}
                    <span>{comment.text}</span>
                  </div>
                  {/* Optional timestamp in a subtle style */}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(comment.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-gray-500 px-4">No comments yet.</p>
        )}
      </div>

      {/* Comment Input Form */}
      <div className="comment-input-area border-t border-gray-200 pt-2">
        <form onSubmit={handleSubmit} className="flex items-center px-4 pb-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-grow bg-transparent border-none text-sm placeholder-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || addingComment}
            className="ml-3 text-sm font-semibold text-blue-500 hover:text-blue-700 disabled:text-blue-300 disabled:cursor-not-allowed focus:outline-none"
          >
            {addingComment ? 'Posting...' : 'Post'}
          </button>
        </form>
        {addCommentError && (
          <p className="text-xs text-red-500 px-4 pb-2">Could not post comment.</p>
        )}
      </div>
    </div>
  );
};

export default CommentBox;
