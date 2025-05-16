import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
import requests
from Domain.src.Loggs.Response import ResponseSuccessMsg, ResponseFailMsg, ResponseSuccessObj

class CloudinaryProfilePictureManager:
    """
    Handles upload, retrieval, and management of profile pictures using Cloudinary.
    """
    
    def __init__(self, cloud_name, api_key, api_secret):
        """Initialize Cloudinary with credentials"""
        self.configured = False
        try:
            # Configure Cloudinary
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret
            )
            self.configured = True
            print(f"Cloudinary configured with cloud_name: {cloud_name}")
        except Exception as e:
            print(f"Failed to initialize Cloudinary: {e}")
    
    def upload_image(self, file_path, public_id=None):
        """
        Upload an image to Cloudinary
        
        Args:
            file_path: Local path to the image file
            public_id: Optional custom public ID (user email recommended)
            
        Returns:
            Response object with success status and result (URL if successful)
        """
        if not self.configured:
            return ResponseFailMsg("Cloudinary not configured")
            
        try:
            if not os.path.exists(file_path):
                return ResponseFailMsg(f"File not found: {file_path}")
            
            print(f"Uploading image from {file_path} with public_id: {public_id}")
                
            # Prepare upload options
            options = {
                'folder': 'profile_pictures',
                'overwrite': True
            }
            
            if public_id:
                # Remove file extension from public_id
                base_name = os.path.splitext(public_id)[0]
                options['public_id'] = base_name
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(file_path, **options)
            
            # The public_id returned by Cloudinary will include the folder
            print(f"Image uploaded successfully. Full public_id: {result['public_id']}")
            
            # Return the secure URL and public_id for reference
            return ResponseSuccessObj("Image uploaded successfully", {
                "url": result['secure_url'],
                "public_id": result['public_id']  # This will include the folder prefix
            })
            
        except Exception as e:
            print(f"Failed to upload image: {e}")
            return ResponseFailMsg(f"Failed to upload image: {e}")
    
    def upload_from_url(self, image_url, public_id=None):
        """
        Upload an image to Cloudinary directly from a URL
        
        Args:
            image_url: URL of the image to upload
            public_id: Optional custom public ID (user email recommended)
            
        Returns:
            Response object with success status and result (URL info if successful)
        """
        if not self.configured:
            return ResponseFailMsg("Cloudinary not configured")
            
        try:
            print(f"Uploading image from URL: {image_url} with public_id: {public_id}")
            
            # Prepare upload options
            options = {
                'folder': 'profile_pictures',
                'overwrite': True
            }
            
            if public_id:
                # Remove file extension if present
                base_name = os.path.splitext(public_id)[0]
                options['public_id'] = base_name
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(image_url, **options)
            
            # The public_id returned by Cloudinary will include the folder
            print(f"Image uploaded successfully from URL. Full public_id: {result['public_id']}")
            
            # Return the secure URL and public_id for reference
            return ResponseSuccessObj("Image uploaded successfully", {
                "url": result['secure_url'],
                "public_id": result['public_id']  # This will include the folder prefix
            })
            
        except Exception as e:
            print(f"Failed to upload image from URL: {e}")
            return ResponseFailMsg(f"Failed to upload image from URL: {e}")
    
    def get_profile_picture_url(self, public_id):
        """
        Get the URL for a profile picture
        
        Args:
            public_id: The public ID of the image (may include folder prefix)
            
        Returns:
            URL string or None if not found
        """
        if not self.configured:
            print("Cloudinary not configured")
            return None
            
        try:
            import time
            
            # Check if public_id already contains the folder prefix
            if public_id.startswith('profile_pictures/'):
                # Use the public_id as-is
                image_path = public_id
                print(f"Using existing path: {image_path}")
            else:
                # Add the folder prefix
                image_path = f"profile_pictures/{public_id}"
                print(f"Adding prefix to path: {image_path}")
            
            # Construct the URL using Cloudinary's URL helper
            url = cloudinary.CloudinaryImage(image_path).build_url(
                version=int(time.time()),
                secure=True
            )
            
            print(f"Generated Cloudinary URL: {url}")
            return url
        except Exception as e:
            print(f"Failed to get profile picture URL: {e}")
            return None
    
    def delete_profile_picture(self, public_id):
        """
        Delete a profile picture from Cloudinary
        
        Args:
            public_id: The public ID of the image to delete
            
        Returns:
            Response object with success status
        """
        if not self.configured:
            return ResponseFailMsg("Cloudinary not configured")
            
        try:
            # Check if public_id already contains the folder prefix
            if public_id.startswith('profile_pictures/'):
                # Use the public_id as-is
                full_public_id = public_id
            else:
                # Add the folder prefix
                full_public_id = f"profile_pictures/{public_id}"
                
            print(f"Deleting image with public_id: {full_public_id}")
            
            # Delete the image
            result = cloudinary.uploader.destroy(full_public_id)
            
            if result.get('result') == 'ok':
                return ResponseSuccessMsg("Image deleted successfully")
            else:
                return ResponseFailMsg(f"Failed to delete image: {result.get('result')}")
                
        except Exception as e:
            print(f"Failed to delete image: {e}")
            return ResponseFailMsg(f"Failed to delete image: {e}")