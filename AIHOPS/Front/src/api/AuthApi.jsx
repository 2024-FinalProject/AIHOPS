import axios from "./axiosInstance";
const API_URL = "http://localhost:5555";

export const verify = async (userName, passwd, code) => {
  return await axios.post(`${API_URL}/verify`, {
    userName,
    passwd,
    code,
  });
};

export const verifyAutomatic = async (token) => {
  try {
    console.log("Sending automatic verification request with token:", token);
    
    // Get the current cookie from localStorage if available
    const cookie = localStorage.getItem("authToken");
    
    // Prepare the request data
    const requestData = { token };
    
    // Add cookie to request if available
    if (cookie) {
      requestData.cookie = cookie;
      console.log("Including cookie in verification request:", cookie);
    } else {
      console.log("No cookie available, server will create a new session");
    }
    
    // Send the verification request
    const response = await axios.post(`${API_URL}/verify_automatic`, requestData);
    
    console.log("Verification response:", response.data);
    
    // If verification was successful, store any returned email for login
    if (response.data.success && response.data.email) {
      console.log("Storing verified email:", response.data.email);
      localStorage.setItem("verifiedEmail", response.data.email);
    }
    
    return response;
  } catch (error) {
    console.error("Automatic verification error:", error);
    
    // Return a structured error response
    return {
      data: {
        success: false,
        message: error.message || "Verification failed",
        error: error.response ? error.response.data : "Network error"
      }
    };
  }
};

export const register = async (userName, passwd, acceptedTermsVersion) => {
  return await axios.post(`${API_URL}/register`, {
    userName,
    passwd,
    acceptedTermsVersion,
  });
};

export const loginUser = async (userName, passwd) => {
  return await axios.post(`${API_URL}/login`, { userName, passwd });
};

export const logoutUser = async () => {
  return await axios.post(`${API_URL}/logout`, {});
};

export const startSession = async () => {
  const response = await axios.get(`${API_URL}/enter`, { skipAuth: true });
  return response;
};

export const startPasswordRecovery = async (email) => {
  return await axios.post(`${API_URL}/start_password_recovery`, {
    email,
  });
};

export const updatePassword = async (email, password, code) => {
  return await axios.post(`${API_URL}/update_password`, {
    email,
    password,
    code,
  });
};

//Google Login method:
export const googleLogin = async (tokenId, acceptedTermsVersion) => {
  localStorage.setItem('googleToken', tokenId);
  return await axios.post(`${API_URL}/google_login`, {
    tokenId,
    acceptedTermsVersion,
  });
};

export const checkEmailExists = async (tokenId) => {
  return await axios.post(`${API_URL}/check_email_exists`, { tokenId });
};

export const isValidSession = async (cookie, email) => {
  return await axios.get(`${API_URL}/is-valid-session`, {
    params: {
      skipAuth: true,
      cookie: cookie,
      email: email,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const deleteAccount = async () => {
  return await axios.post(`${API_URL}/delete_account`, {});
};

export const acceptNewTerms = async (acceptedTermsVersion) => {
  return await axios.post(`${API_URL}/accept-terms`, {
    acceptedTermsVersion,
  });
};

// Function to fetch Google profile picture with source parameter
export const fetchGoogleProfilePicture = async (tokenId, source = 'google') => {
  try {
    console.log('Fetching Google profile picture, tokenId length:', tokenId ? tokenId.length : 0);
    console.log('Current auth token:', localStorage.getItem('authToken'));
    
    const response = await axios.post(`${API_URL}/fetch_google_profile_picture`, { 
      tokenId,
      cookie: localStorage.getItem('authToken'),
      source // Explicitly set the source as 'google'
    });
    
    console.log('Google profile picture response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching Google profile picture:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    return { 
      data: { 
        success: false, 
        message: error.message || 'Failed to fetch Google profile picture',
        error: error.response ? error.response.data : 'No response data'
      } 
    };
  }
};

// Upload profile picture to Cloudinary with source parameter
export const updateProfilePicture = async (file, source = 'upload') => {
  console.log('Starting profile picture upload for file:', file.name);
  console.log('Using source:', source);
  console.log('Current auth token:', localStorage.getItem('authToken'));
  
  // Create FormData
  const formData = new FormData();
  
  // Append the file with 'file' key
  formData.append('file', file);
  
  // Add the source parameter
  formData.append('source', source);
  
  // Get the cookie from localStorage
  const cookie = localStorage.getItem('authToken');
  if (cookie) {
    formData.append('cookie', cookie);
    console.log('Added cookie to form data');
  } else {
    console.error('No authToken found in localStorage');
    return { 
      data: { 
        success: false, 
        message: 'Authentication required - no cookie found in localStorage' 
      } 
    };
  }
  
  try {
    console.log('Making fetch request to upload profile picture');
    
    // Use fetch API with explicit error handling for non-JSON responses
    const response = await fetch(`${API_URL}/upload_profile_picture`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    console.log('Upload response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    // Check if the response status is OK
    if (!response.ok) {
      // Try to parse the error response as text if it's not JSON
      const contentType = response.headers.get('content-type');
      console.error('Response not OK, content type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        // If it's JSON, parse it normally
        const errorData = await response.json();
        console.error('Server returned error:', errorData);
        return { data: errorData };
      } else {
        // If it's not JSON (likely HTML error page), get it as text
        const errorText = await response.text();
        console.error('Server returned non-JSON error:', errorText.substring(0, 500) + '...');
        
        // Create a friendly error response
        return {
          data: {
            success: false,
            message: `Server error (${response.status}): The server encountered an error. Please check server logs.`,
            serverStatus: response.status
          }
        };
      }
    }
    
    // Parse successful response as JSON
    const responseData = await response.json();
    console.log('Successfully uploaded profile picture:', responseData);
    return { data: responseData };
    
  } catch (error) {
    console.error('Client-side error during fetch:', error);
    
    // Return a user-friendly error
    return {
      data: {
        success: false,
        message: `Upload failed: ${error.message || 'Unknown error'}`,
        clientError: true
      }
    };
  }
};

// Get profile source (google or upload)
export const getProfileSource = async () => {
  try {
    console.log('Getting profile source');
    const cookie = localStorage.getItem('authToken');
    if (!cookie) {
      console.error('No authToken found in localStorage');
      return { 
        data: { 
          success: false, 
          message: 'Authentication required' 
        } 
      };
    }
    
    const response = await axios.get(`${API_URL}/get_profile_source`, {
      params: { cookie }
    });
    
    console.log('Profile source response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching profile source:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    return {
      data: {
        success: false,
        message: error.message || 'Failed to fetch profile source',
        source: 'none',
        error: error.response ? error.response.data : 'No response data'
      }
    };
  }
};

// Get profile picture URL - redirects to Cloudinary
export const getProfilePictureUrl = (email) => {
  if (!email) {
    console.warn('getProfilePictureUrl called with no email');
    return null;
  }
  
  // Add cache-busting timestamp parameter to prevent browser caching
  const timestamp = new Date().getTime();
  const url = `${API_URL}/get_profile_picture/${email}?t=${timestamp}`;
  console.log('Generated profile picture URL:', url);
  return url;
};