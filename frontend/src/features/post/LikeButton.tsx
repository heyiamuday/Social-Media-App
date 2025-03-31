// src/features/post/LikeButton.tsx
import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";

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
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);

  const [toggleLike] = useMutation(TOGGLE_LIKE_MUTATION, {
    variables: { postId },
    optimisticResponse: {
      toggleLike: {
        __typename: "Post",
        id: postId,
        likeCount: liked ? likeCount - 1 : likeCount + 1,
        likedByCurrentUser: !liked,
      },
    },
    onError: (error) => {
      console.error("Error toggling like", error);
      setLiked(initialLiked);
      setLikeCount(initialLikeCount);
    },
  });

  const handleClick = () => {
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newCount);
    toggleLike();
  };

  return (
    <button onClick={handleClick} className="flex items-center space-x-2 focus:outline-none">
      <svg
        className={`w-6 h-6 transition-colors duration-200 ${liked ? "text-red-500 fill-current" : "text-gray-500"}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 
                 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 
                 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <span className="text-sm font-medium">{likeCount.toString()}</span>
    </button>
  );
}
