// src/components/CreatePost.tsx
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';

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
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [postError, setPostError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: () => {
      console.log('Post created');
      navigate('/');
    },
    onError: (err) => {
      console.error('Error creating post:', err);
      setPostError(err.message);
      setPosting(false);
    },
  });


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      setUploadError('Please select an image.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch('http://localhost:4000/upload-image', { // Adjust URL if needed
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image.');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      setUploading(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message);
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setUploadError('Please upload an image first.');
      return;
    }
    setPosting(true);
    setPostError('');
    createPost({ variables: { imageUrl, caption } });
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-md overflow-hidden p-6 mt-10">
      <Link to="/" className="text-indigo-600 hover:underline mb-4 block">
        &larr; Back to Home
      </Link>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Create a New Post</h2>
      {uploadError && <div className="text-red-500 mb-2">{uploadError}</div>}
      {postError && <div className="text-red-500 mb-2">{postError}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">
            Select Image:
          </label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            accept="image/*"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            type="button"
            onClick={handleUploadImage}
            disabled={uploading || !imageFile}
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          {imageUrl && <img src={imageUrl} alt="Uploaded Preview" className="mt-4 max-w-full h-auto rounded-md" />}
        </div>
        <div>
          <label htmlFor="caption" className="block text-gray-700 text-sm font-bold mb-2">
            Caption (Optional):
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          disabled={posting || !imageUrl}
          className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}