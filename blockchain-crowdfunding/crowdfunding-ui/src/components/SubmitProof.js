import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContract } from '../context/ContractContext';
import { motion } from 'framer-motion';
import { storage, db } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import '../styles/SubmitProof.css';

const SubmitProof = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, currentAccount } = useContract();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchCampaignDetails();
  }, [contract, id]);

  const fetchCampaignDetails = async () => {
    try {
      if (!contract) return;
      const campaignData = await contract.campaigns(id);
      setCampaign({
        id,
        name: campaignData.name,
        description: campaignData.description,
        goal: campaignData.goal.toString(),
        raised: campaignData.balance.toString(),
        owner: campaignData.owner,
      });
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError('Failed to fetch campaign details');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size should not exceed 5MB');
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only JPEG, PNG, and PDF files are allowed');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !description) {
      setError('Please provide both proof document and description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate a secure filename
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${id}_${timestamp}_${randomString}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `proofs/${id}/${fileName}`);

      // Create upload task with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          campaignId: id,
          uploadedBy: currentAccount,
          timestamp: timestamp.toString()
        }
      };

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error);
          switch (error.code) {
            case 'storage/unauthorized':
              setError('Permission denied. Please make sure you are logged in.');
              break;
            case 'storage/canceled':
              setError('Upload was cancelled');
              break;
            case 'storage/unknown':
              setError('An unknown error occurred. Please try again.');
              break;
            default:
              setError(error.message);
          }
          setLoading(false);
        },
        async () => {
          try {
            // Get download URL after successful upload
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save proof details to Firestore
            await setDoc(doc(db, 'proofs', id), {
              campaignId: id,
              description,
              fileUrl: downloadURL,
              fileName: fileName,
              fileType: file.type,
              fileSize: file.size,
              submittedBy: currentAccount,
              submittedAt: new Date().toISOString(),
              verified: false
            });

            // Update contract state
            const tx = await contract.submitProof(id);
            await tx.wait();

            setSuccess(true);
            setTimeout(() => {
              navigate('/ngo-dashboard');
            }, 2000);
          } catch (err) {
            console.error('Error completing submission:', err);
            setError(err.message || 'Failed to complete submission');
            setLoading(false);
          }
        }
      );
    } catch (err) {
      console.error('Error initiating upload:', err);
      setError(err.message || 'Failed to start upload');
      setLoading(false);
    }
  };

  if (!campaign) {
    return (
      <div className="submit-proof-container">
        <div className="loading">Loading campaign details...</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="submit-proof-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="submit-proof-card"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button className="back-button" onClick={() => navigate('/ngo-dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Dashboard
        </button>

        <h2>Submit Proof for Campaign</h2>
        <div className="campaign-info">
          <h3>{campaign.name}</h3>
          <p>{campaign.description}</p>
        </div>

        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Proof submitted successfully! Redirecting to dashboard...
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="proof-form">
          <div className="form-group">
            <label>Proof Document (PDF, JPG, PNG - Max 5MB)</label>
            <div className="file-input">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={loading}
              />
              {file && <span className="file-name">{file.name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your work and achievements..."
              disabled={loading}
              required
            />
          </div>

          {loading && uploadProgress > 0 && (
            <div className="upload-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              />
              <span className="progress-text">{Math.round(uploadProgress)}% uploaded</span>
            </div>
          )}

          <motion.button
            type="submit"
            className="submit-button"
            disabled={loading || !file || !description}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="button-loader"></span>
            ) : (
              <>
                Submit Proof
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SubmitProof; 