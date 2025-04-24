// cloudinaryConfig.js - Configuration for Cloudinary image storage

// Cloudinary credentials from user's account
const CLOUDINARY_CONFIG = {
  cloud_name: '',  // User's cloud name
  api_key: '',        // User's API key
  api_secret: '', // User's API secret
  upload_preset: 'donation_track', // Create this unsigned upload preset in your Cloudinary dashboard
  folder: 'donation_track/proofs',  // Base folder for storing proofs
  // Optional settings
  max_file_size: 10 * 1024 * 1024, // 10MB max file size
  allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
};

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Your Cloudinary account is already configured with:
 *    - Cloud name: 
 *    - API key: 
 *    - API secret: 
 * 
 * 2. Create an unsigned upload preset:
 *    - Go to Settings > Upload
 *    - Scroll down to "Upload presets"
 *    - Click "Add upload preset"
 *    - Set "Signing Mode" to "Unsigned"
 *    - Give it a name (e.g., "donation_track")
 *    - Configure other settings as desired (folder, transformations, etc.)
 *    - Save the preset
 * 
 * 3. Make sure CORS is configured properly in your Cloudinary account settings
 */

export const generateUploadUrl = (cloudName) => {
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
};

export default CLOUDINARY_CONFIG; 