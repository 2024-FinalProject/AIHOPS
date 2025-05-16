import React, { useState, useEffect } from 'react';
import { updateProfilePicture as uploadProfilePictureApi, fetchGoogleProfilePicture, getProfileSource, getProfilePictureUrl } from '../api/AuthApi';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaCloudUploadAlt, FaUser } from 'react-icons/fa';

const ProfilePictureUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [currentPictureUrl, setCurrentPictureUrl] = useState('');
  const [profileSource, setProfileSource] = useState('none'); // 'none', 'google', or 'upload'
  
  // Get auth context data - renamed the function to refreshProfilePicture to avoid conflict
  const { userName, updateProfilePicture: refreshProfilePicture } = useAuth();

  // Fetch current profile picture and source on component mount
  useEffect(() => {
    if (userName) {
      console.log('ProfilePictureUpload initialized with userName:', userName);
      
      // Get the current profile picture URL
      const profileUrl = getProfilePictureUrl(userName);
      console.log('Generated profile picture URL:', profileUrl);
      setCurrentPictureUrl(profileUrl);
      
      // Get the current profile source
      getProfileSource().then(response => {
        console.log('Profile source API response:', response);
        if (response.data.success) {
          setProfileSource(response.data.source || 'none');
          console.log('Setting profile source to:', response.data.source || 'none');
        } else {
          console.error('Failed to get profile source:', response.data.message);
        }
      }).catch(error => {
        console.error('Error fetching profile source:', error);
      });
    } else {
      console.warn('ProfilePictureUpload initialized with no userName');
    }
  }, [userName]);
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      setSelectedFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        console.log('Preview URL created');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first');
      setIsError(true);
      return;
    }
    
    setIsUploading(true);
    setMessage('');
    setIsError(false);
    console.log('Starting upload for file:', selectedFile.name);
    
    try {
      console.log('Calling updateProfilePicture API');
      // Use the renamed API function to avoid conflict
      const response = await uploadProfilePictureApi(selectedFile, 'upload');
      console.log('Upload API response:', response);
      
      if (response.data.success) {
        setMessage('Profile picture uploaded successfully!');
        setIsError(false);
        setProfileSource('upload');
        
        // Update the current picture URL with cache busting
        const newPictureUrl = getProfilePictureUrl(userName);
        console.log('New profile picture URL:', newPictureUrl);
        setCurrentPictureUrl(newPictureUrl);
        
        // Update profile picture in the auth context to refresh the navbar
        refreshProfilePicture();
      } else {
        setMessage(response.data.message || 'Failed to upload profile picture');
        setIsError(true);
        console.error('Upload failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage('An error occurred while uploading the profile picture');
      setIsError(true);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFetchFromGoogle = async () => {
    setIsUploading(true);
    setMessage('');
    setIsError(false);
    
    try {
      const googleToken = localStorage.getItem('googleToken');
      console.log('Google token from localStorage:', googleToken ? 'Token exists' : 'No token found');
      
      if (!googleToken) {
        setMessage('No Google account connected. Please login with Google first.');
        setIsError(true);
        setIsUploading(false);
        return;
      }
      
      console.log('Calling fetchGoogleProfilePicture API');
      const response = await fetchGoogleProfilePicture(googleToken, 'google');
      console.log('Google profile API response:', response);
      
      if (response.data.success) {
        setMessage('Google profile picture imported successfully!');
        setIsError(false);
        setProfileSource('google');
        
        // Update the current picture URL with cache busting
        const newPictureUrl = getProfilePictureUrl(userName);
        console.log('New Google profile picture URL:', newPictureUrl);
        setCurrentPictureUrl(newPictureUrl);
        
        // Update profile picture in the auth context to refresh the navbar
        refreshProfilePicture();
        
        // Reset the file selection
        setPreviewUrl(null);
        setSelectedFile(null);
      } else {
        setMessage(response.data.message || 'Failed to import Google profile picture');
        setIsError(true);
        console.error('Google import failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching Google profile picture:', error);
      setMessage('An error occurred while importing the Google profile picture');
      setIsError(true);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="profile-picture-upload">
      <h3>Profile Picture</h3>
      
      <div className="profile-picture-container">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile preview" 
            className="profile-picture-preview" 
          />
        ) : currentPictureUrl ? (
          <img 
            src={currentPictureUrl} 
            alt="Current profile" 
            className="current-profile-picture" 
            onError={(e) => {
              console.error('Current profile image failed to load:', currentPictureUrl);
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<div class="profile-picture-placeholder"><svg width="50" height="50" viewBox="0 0 50 50"><text x="50%" y="50%" font-size="20" text-anchor="middle" dy=".3em">?</text></svg></div>';
            }}
          />
        ) : (
          <div className="profile-picture-placeholder">
            <FaUser size={50} color="#888" />
          </div>
        )}
      </div>
      
      <div className="profile-source-options">
        <div className="option-tabs">
          <button 
            className={`option-tab ${profileSource === 'upload' || profileSource === 'none' ? 'active' : ''}`}
            onClick={() => setProfileSource('upload')}
          >
            <FaCloudUploadAlt /> Upload Image
          </button>
          
          <button 
            className={`option-tab ${profileSource === 'google' ? 'active' : ''}`}
            onClick={() => setProfileSource('google')}
          >
            <FaGoogle /> Google Picture
          </button>
        </div>
        
        <div className="option-content">
          {profileSource === 'google' ? (
            <div className="google-option">
              <p>Use your Google profile picture linked to your account.</p>
              <button 
                className="button google-button"
                onClick={handleFetchFromGoogle}
                disabled={isUploading}
              >
                <FaGoogle /> Import From Google
              </button>
            </div>
          ) : (
            <div className="upload-option">
              <p>Upload a profile picture from your device.</p>
              <input
                type="file"
                id="profile-picture-input"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
                className="file-input"
              />
              <div className="upload-buttons">
                <label htmlFor="profile-picture-input" className="button select-button">
                  Select Image
                </label>
                
                <button
                  className="button upload-button"
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;