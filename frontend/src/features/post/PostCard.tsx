// src/features/post/PostCard.tsx
import React from "react";
import LikeButton from "./LikeButton";

interface PostCardProps {
  post: {
    id: number;
    imageUrl: string;
    caption?: string;
    createdAt: string;
    author: {
      id: number;
      username: string;
    };
    likeCount: number;
    likedByCurrentUser: boolean;
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="post-card p-4 bg-white rounded shadow">
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
        alt={post.caption || "Post image"}
        className="w-full h-auto rounded-md"
      />
      {post.caption && (
        <p className="text-gray-700 mt-2">{post.caption}</p>
      )}
      {/* Include the LikeButton here */}
      <LikeButton
        postId={post.id.toString()}
        initialLiked={post.likedByCurrentUser}
        initialLikeCount={post.likeCount}
      />
    </div>
  );
}
