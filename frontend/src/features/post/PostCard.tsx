//frontend/src/features/post/PostCard.tsx
import React from "react";
import { Link } from 'react-router-dom';
import LikeButton from "./LikeButton";
import CommentBox from "./CommentBox";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'; // Example icon for options
import { formatDistanceToNow } from 'date-fns'; // For relative time

interface PostCardProps {
  post: {
    id: number;
    imageUrl: string;
    caption?: string;
    createdAt: string; // Expecting ISO string date
    author: {
      id: number;
      username: string;
      avatarUrl?: string; // Added avatarUrl field
    };
    likeCount: number;
    likedByCurrentUser: boolean;
  };
}

// Helper function to format time ago
const timeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // Check if the date is valid AFTER parsing
    if (isNaN(date.getTime())) {
       console.error("Parsed date is invalid:", dateString);
       return "Invalid date";
    }
    return formatDistanceToNow(date, { addSuffix: false }); // e.g., "5 minutes ago"
  } catch (error) {
    console.error("Error parsing date:", error, dateString); // Log the input string
    return "Invalid date";
  }
};

// Avatar component to reuse throughout the app
export const Avatar = ({ avatarUrl, username }: { avatarUrl?: string, username: string }) => {
  return avatarUrl ? (
    <img 
      src={avatarUrl} 
      alt={`${username}'s avatar`} 
      className="w-8 h-8 rounded-full object-cover"
    />
  ) : (
    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
      {username.charAt(0).toUpperCase()}
    </div>
  );
};

export default function PostCard({ post }: PostCardProps) {
  const postIdString = post.id.toString(); // Ensure postId is a string for LikeButton

  return (
    <div className="post-card bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300">
        <div className="flex items-center space-x-3">
          {/* Author Avatar */}
          <Link to={`/user/${post.author.username}`}>
            <Avatar avatarUrl={post.author.avatarUrl} username={post.author.username} />
          </Link>
          <Link to={`/user/${post.author.username}`} className="text-sm font-semibold text-gray-900 hover:underline">
            {post.author.username}
          </Link>
        </div>
        {/* Post Options Placeholder */}
        <button className="text-gray-500">
          <FontAwesomeIcon icon={faEllipsisH} />
        </button>
      </div>

      {/* Post Image */}
      <img
        src={post.imageUrl}
        alt={post.caption || "Post image"}
        className="w-full object-cover" // Ensure image covers area
      />

      {/* Post Actions & Info */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center space-x-4">
          <LikeButton
            postId={postIdString}
            initialLiked={post.likedByCurrentUser}
            initialLikeCount={post.likeCount}
          />
          {/* Comment Icon Placeholder */}
          {/* <button className="text-gray-700"><FontAwesomeIcon icon={faComment} size="lg" /></button> */}
          {/* Share Icon Placeholder */}
          {/* <button className="text-gray-700"><FontAwesomeIcon icon={faPaperPlane} size="lg" /></button> */}
        </div>

        {/* Like Count */}
        {post.likeCount > 0 && (
          <p className="text-sm font-semibold text-gray-900">
            {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-900">
            <Link to={`/user/${post.author.username}`} className="font-semibold mr-1 hover:underline">
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        )}

        {/* View Comments (Placeholder or Link) */}
        {/* <Link to={`/post/${post.id}/comments`} className="text-sm text-gray-500">View all comments</Link> */}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {timeAgo(post.createdAt)}
        </p>
      </div>

      {/* Comment Box (collapsible or separate view might be better) */}
      <div className="border-t border-gray-300 px-4 py-2">
         <CommentBox postId={post.id} />
      </div>
    </div>
  );
}
