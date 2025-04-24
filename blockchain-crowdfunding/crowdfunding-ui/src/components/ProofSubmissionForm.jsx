import React, { useState, useRef } from 'react';
import { FiPaperclip, FiInfo, FiCheck, FiX } from 'react-icons/fi';
import { submitProof } from '../utils/proofUtils';
import { formatFileSize } from '../utils/fileUtils';
import '../styles/ProofSubmissionForm.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ProofSubmissionForm = ({ campaignId, onSubmissionSuccess, currentAccount }) => {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setDescription('');
    setFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      setFile(null);
      setPreview(null);
      return;
    }
    
    setError('');
    setFile(selectedFile);
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if wallet is connected
    if (!currentAccount) {
      setError('Please connect your wallet to submit proof');
      return;
    }
    
    // Validate description
    if (!description.trim()) {
      setError('Please provide a description of the progress');
      return;
    }
    
    // Validate file
    if (!file) {
      setError('Please upload a file as proof');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      await submitProof(campaignId, description, file, currentAccount);
      setSuccess('Proof submitted successfully!');
      
      // Inform parent component
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error submitting proof:', err);
      setError(err.message || 'Failed to submit proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="proof-submission-form">
      <h3>Submit Progress Proof</h3>
      
      <div className="form-description">
        <FiInfo className="info-icon" />
        <span>Upload photos, receipts, or documents that demonstrate the campaign's progress.</span>
      </div>
      
      {success && (
        <div className="success-message">
          <FiCheck className="success-icon" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <FiX className="success-icon" />
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">Progress Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what progress has been made and how the funds have been used..."
            rows={4}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Proof Document</label>
          <div className="file-input-container">
            <div className="file-input-button">
              <FiPaperclip className="paperclip-icon" />
              <span>Choose File</span>
              <input 
                type="file" 
                onChange={handleFileChange} 
                ref={fileInputRef}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
              />
            </div>
            
            <div className="file-info">
              {file ? (
                <div className="selected-file">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <button 
                    type="button" 
                    className="remove-file-btn"
                    onClick={removeFile}
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <span className="no-file">No file selected</span>
              )}
            </div>
          </div>
        </div>
        
        {preview && (
          <div className="file-preview">
            <img src={preview} alt="File preview" />
          </div>
        )}
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting || !currentAccount}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Proof'}
        </button>
      </form>
    </div>
  );
};

export default ProofSubmissionForm; 