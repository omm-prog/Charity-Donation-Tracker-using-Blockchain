import React, { useState } from 'react';
import CLOUDINARY_CONFIG from '../config/cloudinaryConfig';

const CloudinarySetup = () => {
  const [preset, setPreset] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [testingPreset, setTestingPreset] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testPreset = async () => {
    if (!preset) {
      alert('Please enter your upload preset name');
      return;
    }

    setTestingPreset(true);
    setTestResult(null);

    try {
      // Create a simple test file (a small canvas as blob)
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#6c5ce7';
      ctx.fillRect(0, 0, 100, 100);
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const testFile = new File([blob], 'test.png', { type: 'image/png' });

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('upload_preset', preset);
      formData.append('api_key', CLOUDINARY_CONFIG.api_key);
      formData.append('folder', 'test');
      formData.append('public_id', `test_${Date.now()}`);

      // Upload to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.error) {
        setTestResult({
          success: false,
          message: result.error.message
        });
      } else {
        setTestResult({
          success: true,
          message: 'Upload preset is working correctly!',
          url: result.secure_url
        });
        setSetupComplete(true);
        
        // Update the preset in local storage for future use
        localStorage.setItem('cloudinary_preset', preset);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to test upload preset'
      });
    } finally {
      setTestingPreset(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Cloudinary Setup Guide</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#444' }}>Your Cloudinary Account Information</h3>
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <p><strong>Cloud Name:</strong> {CLOUDINARY_CONFIG.cloud_name}</p>
          <p><strong>API Key:</strong> {CLOUDINARY_CONFIG.api_key}</p>
          <p><strong>API Secret:</strong> {CLOUDINARY_CONFIG.api_secret ? CLOUDINARY_CONFIG.api_secret.substring(0, 8) + '...' : 'Not configured'}</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#444' }}>Step 1: Create an Upload Preset</h3>
        <ol style={{ 
          lineHeight: '1.6',
          paddingLeft: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <li>Go to your <a 
            href="https://cloudinary.com/console/settings/upload" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#6c5ce7', textDecoration: 'none', fontWeight: '500' }}
          >Cloudinary Upload Settings</a></li>
          <li>Scroll down to "Upload presets"</li>
          <li>Click "Add upload preset"</li>
          <li>Set "Signing Mode" to "Unsigned"</li>
          <li>Give it a name (e.g., "donation_track")</li>
          <li>In the "Folder" field, enter "donation_track/proofs"</li>
          <li>Save the preset</li>
        </ol>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <input 
            type="text" 
            placeholder="Enter your upload preset name"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              flex: 1
            }}
          />
          <button
            onClick={testPreset}
            disabled={testingPreset || !preset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: testingPreset || !preset ? 'not-allowed' : 'pointer',
              opacity: testingPreset || !preset ? 0.7 : 1
            }}
          >
            {testingPreset ? 'Testing...' : 'Test Preset'}
          </button>
        </div>
        
        {testResult && (
          <div style={{
            padding: '1rem',
            backgroundColor: testResult.success ? '#e6fffa' : '#fff5f5',
            color: testResult.success ? '#047857' : '#dc2626',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${testResult.success ? '#10b981' : '#ef4444'}`
          }}>
            <p style={{ marginBottom: testResult.url ? '0.5rem' : 0 }}>{testResult.message}</p>
            {testResult.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <img 
                  src={testResult.url} 
                  alt="Test upload" 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {setupComplete && (
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#f0fff4',
          borderRadius: '8px',
          borderLeft: '4px solid #48bb78',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#2f855a', marginBottom: '0.5rem' }}>Setup Complete!</h3>
          <p>Your Cloudinary integration is now working correctly. You can now use Cloudinary to store proof images.</p>
          <p style={{ marginTop: '0.5rem' }}>The upload preset <strong>{preset}</strong> will be used for all future uploads.</p>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#444' }}>Step 2: Update Configuration (Optional)</h3>
        <p style={{ marginBottom: '1rem' }}>
          If you want to make additional changes to your Cloudinary configuration, you can edit the file:
        </p>
        <div style={{ 
          padding: '0.75rem 1rem',
          backgroundColor: '#f1f5f9',
          borderRadius: '4px',
          fontFamily: 'monospace',
          overflowX: 'auto',
          marginBottom: '1rem'
        }}>
          <code>crowdfunding-ui/src/config/cloudinaryConfig.js</code>
        </div>
        <p>
          In this file, you can customize settings like allowed file formats, maximum file size, and more.
        </p>
      </div>
      
      <div style={{ 
        marginTop: '2rem', 
        paddingTop: '1rem',
        borderTop: '1px solid #eee',
        textAlign: 'center'
      }}>
        <a 
          href="/cloudinary-test" 
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: setupComplete ? '#6c5ce7' : '#e2e8f0',
            color: setupComplete ? 'white' : '#64748b',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: '500',
            cursor: setupComplete ? 'pointer' : 'not-allowed',
            opacity: setupComplete ? 1 : 0.7
          }}
        >
          Go to Cloudinary Test Page
        </a>
      </div>
    </div>
  );
};

export default CloudinarySetup; 