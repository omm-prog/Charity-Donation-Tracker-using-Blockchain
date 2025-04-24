import React, { useState } from 'react';
import { uploadToCloudinary } from '../utils/proofUtils';
import CLOUDINARY_CONFIG from '../config/cloudinaryConfig';

const CloudinaryTest = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError(null);
    setResult(null);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    setResult(null);
    
    try {
      // Test campaign ID
      const testCampaignId = 'test_campaign_' + Date.now();
      const uploadResult = await uploadToCloudinary(file, testCampaignId);
      setResult(uploadResult);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload file to Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Cloudinary Upload Test</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <p>This is a test component to verify that Cloudinary is properly configured.</p>
        <p>Cloud Name: <strong>{CLOUDINARY_CONFIG.cloud_name}</strong></p>
        <p>Upload Preset: <strong>{CLOUDINARY_CONFIG.upload_preset}</strong></p>
      </div>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label 
          style={{ 
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}
        >
          Select a file to upload:
        </label>
        <input 
          type="file" 
          onChange={handleFileChange} 
          accept={CLOUDINARY_CONFIG.allowed_formats?.map(format => `.${format}`).join(',')}
          style={{
            marginBottom: '1rem'
          }}
        />
        <button 
          onClick={handleUpload}
          disabled={uploading || !file}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading || !file ? 'not-allowed' : 'pointer',
            opacity: uploading || !file ? 0.7 : 1
          }}
        >
          {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
        </button>
      </div>
      
      {preview && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Preview:</h3>
          <img 
            src={preview} 
            alt="File preview" 
            style={{ 
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>
      )}
      
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#ffe3e3',
          color: '#d63031',
          borderRadius: '4px',
          marginBottom: '1.5rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Upload Result:</h3>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
          
          {result.secure_url && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Uploaded Image:</h4>
              <img 
                src={result.secure_url} 
                alt="Uploaded to Cloudinary" 
                style={{ 
                  maxWidth: '100%', 
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
              <p style={{ marginTop: '0.5rem' }}>
                <a 
                  href={result.secure_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    color: '#6c5ce7',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Open Image URL
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudinaryTest; 