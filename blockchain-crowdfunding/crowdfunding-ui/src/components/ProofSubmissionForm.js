import React, { useState, useEffect } from 'react';
import { submitProof } from '../utils/proofUtils';
import { useContract } from '../context/ContractContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const ProofSubmissionForm = ({ campaignId, campaignName }) => {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { currentAccount } = useContract();

  // Clear preview when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Reset message and preview
    setMessage({ type: '', text: '' });
    
    if (selectedFile) {
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size exceeds 5MB limit' });
        return;
      }
      
      // Set file for upload
      setFile(selectedFile);
      
      // Create preview for image files
      if (selectedFile.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentAccount) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }
    
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please provide a progress description' });
      return;
    }
    
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });
      
      await submitProof({
        campaignId,
        title: campaignName || 'Campaign Progress',
        description,
        file,
        currentAccount
      });
      
      // Reset form on success
      setDescription('');
      setFile(null);
      setPreviewUrl(null);
      setMessage({ type: 'success', text: 'Proof submitted successfully!' });
      toast.success('Proof submitted successfully!');
      
      // Reset file input
      const fileInput = document.getElementById('proof-file');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error submitting proof:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to submit proof. Please try again.' 
      });
      toast.error('Failed to submit proof: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white shadow-md rounded-lg p-6 mb-6"
    >
      <h2 className="text-xl font-semibold mb-4">Submit Progress Proof</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Progress Description*
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Describe how the funds have been used and the progress made..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Documentation/Image*
          </label>
          <input
            id="proof-file"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max file size: 5MB. Accepted formats: Images, PDF, DOC.
          </p>
        </div>
        
        {previewUrl && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <div className="border rounded-md p-2 bg-gray-50">
              <img 
                src={previewUrl} 
                alt="File preview" 
                className="max-h-40 mx-auto object-contain"
              />
            </div>
          </div>
        )}
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-md ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting || !currentAccount}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isSubmitting || !currentAccount
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Proof'}
        </button>
      </form>
    </motion.div>
  );
};

export default ProofSubmissionForm; 