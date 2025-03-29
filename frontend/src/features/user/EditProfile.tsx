// src/components/EditProfile.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';

// import '../../styles/components/editProfile.scss';


const GET_PROFILE_FOR_EDIT = gql`
  query GetProfileForEdit {
    me {
      id
      name
      username
      email
      bio
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String!, $username: String!, $email: String!, $bio: String) {
    updateProfile(name: $name, username: $username, email: $email, bio: $bio) {
      id
      name
      username
      email
      bio
    }
  }
`;

export default function EditProfile({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { loading: loadingProfile, error: errorProfile, data: profileData } = useQuery(GET_PROFILE_FOR_EDIT);
  const [updateProfile, { loading: updatingProfile, error: updateError }] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => onClose(),
    onError: (err) => {
      console.error("Error updating profile:", err);
    }
  });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (errorProfile) {
      localStorage.removeItem('token');
      navigate('/auth');
    }
    if (profileData?.me) {
      setName(profileData.me.name);
      setUsername(profileData.me.username);
      setEmail(profileData.me.email);
      setBio(profileData.me.bio);
    }
  }, [errorProfile, navigate, profileData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData?.me?.id) {
      updateProfile({ variables: { name, username, email, bio } });
    }
  };

  if (loadingProfile) return <div>Loading profile data...</div>;
  if (errorProfile) return <div>Error loading profile data.</div>;
  if (!profileData) return null;

///-[ ] -Success Message: After a successful profile update
///-[ ] -maximum length for the bio


  return (
    <div className="edit-profile-popup">
      <div className="popup-container">
        <div className="header">
          <h2>Edit Profile</h2>
          <button> <Link to="/profile"  >&times;  </Link>
           </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={updatingProfile}
            className="submit-btn"
          >
            {updatingProfile ? 'Updating...' : 'Save Changes'}
          </button>
          {updateError && <p className="error-message">Error updating profile.</p>}
        </form>
      </div>
    </div>
  );
}
