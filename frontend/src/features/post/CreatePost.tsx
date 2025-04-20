// src/components/CreatePost.tsx
import { useState, useRef } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';

const CREATE_POST_MUTATION = gql`
  mutation CreatePost($imageUrl: String!, $caption: String) {
    createPost(imageUrl: $imageUrl, caption: $caption) {
      id
      imageUrl
      caption
      author {
        id
        username
      }
    }
  }
`;

export default function CreatePost() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [postError, setPostError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createPostMutation] = useMutation(CREATE_POST_MUTATION, {
    update(cache, { data: { createPost: newPost } }) {
      // Example: Add to the beginning of allPosts query
      // This requires your GET_ALL_POSTS query to be defined elsewhere
      // and assumes 'allPosts' is the root query field name
      // cache.modify({
      //   fields: {
      //     allPosts(existingPosts = []) {
      //       const newPostRef = cache.writeFragment({
      //         data: newPost,
      //         fragment: gql`
      //           fragment NewPost on Post {
      //             id
      //             imageUrl
      //             caption
      //             createdAt
      //             likeCount
      //             likedByCurrentUser
      //             author { id username }
      //           }
      //         `
      //       });
      //       return [newPostRef, ...existingPosts];
      //     }
      //   }
      // });
    },
    onCompleted: () => {
      console.log('Post created successfully');
      navigate('/');
    },
    onError: (err) => {
      console.error('Error creating post:', err);
      setPostError(err.message || 'Failed to create post. Please try again.');
      setPosting(false);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setPostError('');
    setUploadedImageUrl(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      setUploadError('Please select an image file first.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setPostError('');
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL.replace('/graphql', '');
      const response = await fetch(`${apiBaseUrl}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error('Image URL not found in upload response.');
      }
      setUploadedImageUrl(data.imageUrl);
      console.log('Image uploaded successfully:', data.imageUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'An unknown error occurred during upload.');
      setImagePreviewUrl(null);
      setImageFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImageUrl) {
      if (imageFile && !uploading) {
        handleUploadImage().then(() => {
          if (uploadedImageUrl) {
            setPosting(true);
            setPostError('');
            createPostMutation({ variables: { imageUrl: uploadedImageUrl, caption } });
          } else {
            setPostError('Image upload failed. Cannot create post.');
          }
        });
      } else if (uploading) {
        setPostError('Please wait for the image to finish uploading.');
      } else {
        setPostError('Please select and upload an image first.');
      }
      return;
    }

    setPosting(true);
    setPostError('');
    createPostMutation({ variables: { imageUrl: uploadedImageUrl, caption } });
  };

  const isReadyToPost = !!uploadedImageUrl;
  const canAttemptUpload = !!imageFile && !uploading && !uploadedImageUrl;

  return (
    <div className="create-post-container max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-8">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-blue-500 hover:text-blue-700">Cancel</button>
        <h2 className="text-base font-semibold text-gray-900">Create new post</h2>
        <button
          type="submit"
          form="create-post-form"
          disabled={posting || uploading || !isReadyToPost}
          className="text-sm font-semibold text-blue-500 hover:text-blue-700 disabled:text-blue-300"
        >
          {posting ? 'Sharing...' : 'Share'}
        </button>
      </div>

      <form id="create-post-form" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row min-h-[60vh]">
          <div className="w-full md:w-1/2 aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-gray-200">
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                <FontAwesomeIcon icon={faImage} size="3x" className="mb-4" />
                <p className="text-lg mb-2">Drag photos and videos here</p>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-1.5 px-3 rounded"
                >
                  Select from computer
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id="image-upload"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            {imageFile && !uploading && !uploadedImageUrl && (
              <button
                type="button"
                onClick={handleUploadImage}
                className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded shadow-md text-sm flex items-center space-x-1"
              >
                <FontAwesomeIcon icon={faUpload} />
                <span>Confirm Upload</span>
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-white" />
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 p-4 flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
              <span className="text-sm font-semibold text-gray-900">YourUsername</span>
            </div>

            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="flex-grow w-full border-none resize-none focus:outline-none text-sm p-0 placeholder-gray-400 mb-2"
              maxLength={2200}
            />
            <p className="text-xs text-gray-400 self-end mb-4">{caption.length}/2200</p>

            {(uploadError || postError) && (
              <div className="mt-auto pt-2 text-sm text-red-600">
                {uploadError && <p>Upload Error: {uploadError}</p>}
                {postError && <p>Post Error: {postError}</p>}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}