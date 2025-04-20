// frontend/src/features/user/EditProfileModal.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_PROFILE_FOR_EDIT = gql`
  query GetProfileForEdit {
    me {
      id
      name
      username
      email
      bio
      avatarUrl
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String!, $username: String!, $email: String!, $bio: String, $avatarUrl: String) {
    updateProfile(name: $name, username: $username, email: $email, bio: $bio, avatarUrl: $avatarUrl) {
      id
      name
      username
      email
      bio
      avatarUrl
    }
  }
`;

interface EditProfileModalProps {
  onClose: () => void;
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { loading: loadingProfile, error: errorProfile, data: profileData } = useQuery(GET_PROFILE_FOR_EDIT, {
    fetchPolicy: 'cache-and-network',
  });

  const [updateProfile, { loading: updatingProfile, error: updateError }] = useMutation(UPDATE_PROFILE, {
    update(cache, { data: { updateProfile: updatedUserData } }) {
      if (!updatedUserData) return;
      cache.writeQuery({
        query: GET_PROFILE_FOR_EDIT,
        data: { me: updatedUserData },
      });
    },
    onCompleted: () => {
      console.log("Profile updated successfully!");
      onClose();
    },
    onError: (err) => {
      console.error("Error updating profile:", err);
    }
  });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errorProfile) {
      console.error("Error fetching profile data for edit:", errorProfile);
      localStorage.removeItem('token');
      onClose();
    }
    if (profileData?.me) {
      setName(profileData.me.name || '');
      setUsername(profileData.me.username || '');
      setEmail(profileData.me.email || '');
      setBio(profileData.me.bio || '');
      setAvatarUrl(profileData.me.avatarUrl || '');
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };

  }, [errorProfile, profileData, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size should be less than 5MB.');
        return;
      }
      setAvatarFile(file);
      setUploadError('');
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return avatarUrl;
    
    try {
      setIsUploading(true);
      setUploadError('');
      
      const formData = new FormData();
      formData.append('image', avatarFile);
      
      const response = await fetch('http://localhost:4000/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError('Failed to upload image. Please try again.');
      return avatarUrl; // Return existing URL if upload fails
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Only upload if a new file was selected
      const finalAvatarUrl = avatarFile ? await uploadAvatar() : avatarUrl;
      
      if (profileData?.me?.id) {
        updateProfile({ 
          variables: { 
            name, 
            username, 
            email, 
            bio,
            avatarUrl: finalAvatarUrl 
          } 
        });
      }
    } catch (error) {
      console.error('Error in profile update:', error);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const textareaClass = `${inputClass} h-24`;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {loadingProfile ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center mb-6">
                <label className={labelClass}>Profile Picture</label>
                <div 
                  className="w-24 h-24 rounded-full border border-gray-300 overflow-hidden cursor-pointer relative"
                  onClick={handleAvatarClick}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Overlay with upload icon */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                    </svg>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, image/gif" 
                  className="hidden"
                />
                
                <p className="text-xs text-gray-500 mt-1">Click to upload a profile picture</p>
                
                {isUploading && <p className="text-xs text-blue-500 mt-1">Uploading image...</p>}
                {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
              </div>

              <div>
                <label htmlFor="name" className={labelClass}>Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label htmlFor="username" className={labelClass}>Username</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label htmlFor="bio" className={labelClass}>Bio</label>
                <textarea id="bio" value={bio || ''} onChange={(e) => setBio(e.target.value)} className={textareaClass} maxLength={150}></textarea>
                <p className="text-xs text-gray-500 mt-1">{bio?.length || 0}/150</p>
              </div>

              {updateError && (
                <p className="text-sm text-red-600">Error updating profile: {updateError.message}</p>
              )}
            </form>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={updatingProfile || loadingProfile || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {updatingProfile || isUploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
