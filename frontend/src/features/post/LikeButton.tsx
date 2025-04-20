// src/features/post/LikeButton.tsx
import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'; // Filled heart
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'; // Outline heart

const TOGGLE_LIKE_MUTATION = gql`
  mutation ToggleLike($postId: ID!) {
    toggleLike(postId: $postId) {
      id
      likeCount
      likedByCurrentUser
    }
  }
`;

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
}

export default function LikeButton({
  postId,
  initialLiked = false,
  initialLikeCount = 0,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  // No need for separate likeCount state if parent PostCard displays it
  // const [likeCount, setLikeCount] = useState<number>(initialLikeCount);

  const [toggleLike, { error }] = useMutation(TOGGLE_LIKE_MUTATION, {
    variables: { postId },
    optimisticResponse: {
      toggleLike: {
        __typename: "Post",
        id: postId,
        // Optimistically update parent component's state via cache update if possible
        // or rely on refetchQueries in the component using PostCard
        likeCount: liked ? initialLikeCount - 1 : initialLikeCount + 1,
        likedByCurrentUser: !liked,
      },
    },
    update(cache, { data: { toggleLike } }) {
      // Update the cache directly for immediate UI feedback
      // This requires careful cache normalization
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postId }),
        fields: {
          likeCount() {
            return toggleLike.likeCount;
          },
          likedByCurrentUser() {
            return toggleLike.likedByCurrentUser;
          },
        },
      });
    },
    onError: (err) => {
      console.error("Error toggling like:", err);
      // Revert optimistic update on error
      setLiked(initialLiked);
      // Potentially show an error message to the user
    },
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent any default button behavior
    e.stopPropagation(); // Prevent triggering actions on parent elements

    // Optimistically update UI state
    setLiked(!liked);

    // Execute mutation
    toggleLike();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center focus:outline-none text-gray-700 hover:text-red-500 group"
      aria-label={liked ? "Unlike post" : "Like post"}
    >
      <FontAwesomeIcon
        icon={liked ? faHeartSolid : faHeartRegular}
        className={`w-6 h-6 transition-colors duration-200 ${liked ? "text-red-500" : "group-hover:text-red-400"}`}
      />
      {/* Like count is typically displayed separately in the PostCard */}
      {/* <span className="text-sm font-medium ml-1">{likeCount.toString()}</span> */}
      {error && <span className="text-xs text-red-500 ml-2">Error</span>} 
    </button>
  );
}
