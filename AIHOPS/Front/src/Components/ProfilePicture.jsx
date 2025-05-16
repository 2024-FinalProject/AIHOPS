import React from 'react';
import { FaUser } from 'react-icons/fa';

const ProfilePicture = ({ userName, profilePictureUrl, size = 'medium', onClick = null }) => {
  // Size options
  const sizes = {
    small: { container: 32, icon: 16 },
    medium: { container: 50, icon: 24 },
    large: { container: 150, icon: 50 }
  };
  
  const sizeStyle = sizes[size] || sizes.medium;
  
  const containerStyle = {
    width: `${sizeStyle.container}px`,
    height: `${sizeStyle.container}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid #e0e0e0',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease'
  };
  
  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };
  
  const placeholderStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  };
  
  // Handle image load errors
  const handleImageError = (e) => {
    console.error('Image failed to load:', profilePictureUrl);
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };
  
  return (
    <div 
      style={containerStyle} 
      onClick={onClick}
      className="profile-picture-component"
    >
      {profilePictureUrl ? (
        <>
          <img 
            key={profilePictureUrl} // Add a key prop to force re-render when URL changes
            src={profilePictureUrl} 
            alt={userName || 'Profile'} 
            style={imgStyle}
            onError={handleImageError}
          />
          <div style={{...placeholderStyle, display: 'none'}}>
            <FaUser size={sizeStyle.icon} color="#888" />
          </div>
        </>
      ) : (
        <div style={placeholderStyle}>
          <FaUser size={sizeStyle.icon} color="#888" />
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;