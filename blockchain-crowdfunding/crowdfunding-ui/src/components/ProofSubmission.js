// import React, { useState, useCallback } from 'react';
// import { storage, db } from '../firebase';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
// import { useContract } from '../context/ContractContext';
// import { useCurrency } from '../context/CurrencyContext';
// import '../styles/ProofSubmission.css';

// const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
// const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
// const MAX_DESCRIPTION_LENGTH = 500;
// const MIN_DESCRIPTION_LENGTH = 10;

// const ProofSubmission = ({ campaignId, ngoAddress }) => {
//   const [proofFile, setProofFile] = useState(null);
//   const [description, setDescription] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const { contract, isInitializing } = useContract();
//   const { selectedCurrency, convertAmount } = useCurrency();

//   const validateFile = useCallback((file) => {
//     if (!file) {
//       throw new Error('Please select a file to upload');
//     }

//     if (file.size > MAX_FILE_SIZE) {
//       throw new Error(`File size should be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
//     }

//     if (!ALLOWED_FILE_TYPES.includes(file.type)) {
//       throw new Error('Only PDF, JPEG, and PNG files are allowed');
//     }

//     // Additional security checks
//     const fileName = file.name.toLowerCase();
//     if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
//       throw new Error('Invalid file name');
//     }

//     return true;
//   }, []);

//   const handleFileChange = useCallback((e) => {
//     const file = e.target.files[0];
//     try {
//       validateFile(file);
//       setProofFile(file);
//       setError('');
//     } catch (err) {
//       setError(err.message);
//       setProofFile(null);
//     }
//   }, [validateFile]);

//   const handleDescriptionChange = useCallback((e) => {
//     const value = e.target.value;
//     if (value.length > MAX_DESCRIPTION_LENGTH) {
//       setError(`Description should be less than ${MAX_DESCRIPTION_LENGTH} characters`);
//       return;
//     }
//     setDescription(value);
//     setError('');
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!contract || isInitializing) {
//       setError('Contract not initialized. Please try again.');
//       return;
//     }

//     if (!proofFile || !description) {
//       setError('Please provide both proof file and description');
//       return;
//     }

//     if (description.length < MIN_DESCRIPTION_LENGTH) {
//       setError(`Please provide a more detailed description (minimum ${MIN_DESCRIPTION_LENGTH} characters)`);
//       return;
//     }

//     setLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       // Generate a secure file name
//       const fileExtension = proofFile.name.split('.').pop().toLowerCase();
//       const timestamp = Date.now();
//       const randomString = Math.random().toString(36).substring(2, 15);
//       const fileName = `${campaignId}_${timestamp}_${randomString}.${fileExtension}`;
      
//       // Upload file to Firebase Storage with a unique name
//       const storageRef = ref(storage, `proofs/${campaignId}/${fileName}`);
      
//       // Add metadata for better security
//       const metadata = {
//         contentType: proofFile.type,
//         customMetadata: {
//           uploadedBy: ngoAddress,
//           campaignId: campaignId,
//           timestamp: timestamp.toString()
//         }
//       };
      
//       await uploadBytes(storageRef, proofFile, metadata);
//       const downloadURL = await getDownloadURL(storageRef);

//       // Store proof details in Firestore
//       const proofDoc = await addDoc(collection(db, 'proofs'), {
//         campaignId,
//         ngoAddress,
//         fileUrl: downloadURL,
//         description,
//         timestamp: new Date().toISOString(),
//         status: 'pending',
//         fileName: fileName,
//         fileType: proofFile.type,
//         fileSize: proofFile.size,
//         metadata: {
//           uploadedBy: ngoAddress,
//           campaignId: campaignId,
//           timestamp: timestamp
//         }
//       });

//       // Update campaign status in Firestore
//       const campaignRef = doc(db, 'campaigns', campaignId);
//       await updateDoc(campaignRef, {
//         proofId: proofDoc.id,
//         status: 'proof_submitted',
//         lastUpdated: new Date().toISOString()
//       });

//       // Update smart contract
//       const tx = await contract.submitProof(campaignId, proofDoc.id);
//       await tx.wait();

//       setSuccess('Proof submitted successfully! Waiting for admin verification.');
//       setProofFile(null);
//       setDescription('');
//     } catch (err) {
//       console.error('Error submitting proof:', err);
//       setError(err.message || 'Failed to submit proof. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="proof-submission">
//       <h2>Submit Campaign Completion Proof</h2>
//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label htmlFor="proofFile">
//             Proof Document (PDF, JPEG, or PNG, max 2MB)
//             <span className="required">*</span>
//           </label>
//           <input
//             type="file"
//             id="proofFile"
//             onChange={handleFileChange}
//             accept=".pdf,.jpg,.jpeg,.png"
//             disabled={loading}
//             aria-required="true"
//             aria-invalid={!!error}
//           />
//           {proofFile && (
//             <div className="file-info">
//               <p>Selected file: {proofFile.name}</p>
//               <p>Size: {(proofFile.size / 1024 / 1024).toFixed(2)}MB</p>
//             </div>
//           )}
//         </div>

//         <div className="form-group">
//           <label htmlFor="description">
//             Description
//             <span className="required">*</span>
//             <span className="char-count">
//               {description.length}/{MAX_DESCRIPTION_LENGTH}
//             </span>
//           </label>
//           <textarea
//             id="description"
//             value={description}
//             onChange={handleDescriptionChange}
//             placeholder="Describe how the campaign goals were achieved..."
//             disabled={loading}
//             maxLength={MAX_DESCRIPTION_LENGTH}
//             aria-required="true"
//             aria-invalid={!!error}
//           />
//         </div>

//         {error && <div className="error-message" role="alert">{error}</div>}
//         {success && <div className="success-message" role="status">{success}</div>}

//         <button 
//           type="submit" 
//           disabled={loading || !proofFile || !description}
//           className={loading ? 'loading' : ''}
//         >
//           {loading ? 'Submitting...' : 'Submit Proof'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default ProofSubmission; 

import React, { useState, useEffect } from 'react';
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

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    setMessage({ type: '', text: '' });
    
    if (selectedFile) {
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size exceeds 5MB limit' });
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ type: 'error', text: 'Only images (JPEG, PNG, GIF, WEBP) are allowed' });
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    }
  };

  const saveProofLocally = async (proofData) => {
    return new Promise((resolve) => {
      try {
        // Get existing proofs from localStorage
        const existingProofs = JSON.parse(localStorage.getItem('localProofs') || '[]');
        
        // Add new proof
        const updatedProofs = [...existingProofs, proofData];
        
        // Save back to localStorage
        localStorage.setItem('localProofs', JSON.stringify(updatedProofs));
        
        resolve(true);
      } catch (error) {
        console.error('Error saving proof locally:', error);
        resolve(false);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentAccount) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      toast.error('Wallet not connected');
      return;
    }
    
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please provide a progress description' });
      return;
    }
    
    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image to upload' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });
      
      // Convert image to base64 for local storage
      const reader = new FileReader();
      const imageBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      
      // Create proof object
      const proofData = {
        id: Date.now().toString(),
        campaignId,
        campaignName: campaignName || 'Campaign Progress',
        description,
        image: imageBase64,
        walletAddress: currentAccount,
        timestamp: new Date().toISOString()
      };
      
      // Save locally
      const saveResult = await saveProofLocally(proofData);
      
      if (!saveResult) {
        throw new Error('Failed to save proof locally');
      }
      
      // Reset form on success
      setDescription('');
      setFile(null);
      setPreviewUrl(null);
      
      setMessage({ type: 'success', text: 'Proof saved locally!' });
      toast.success('Proof saved to your device!');
      
      // Reset file input
      const fileInput = document.getElementById('proof-file');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error submitting proof:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save proof. Please try again.' 
      });
      toast.error(error.message || 'Failed to save proof');
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
      <h2 className="text-xl font-semibold mb-4">Submit Progress Proof (Local Storage)</h2>
      <p className="text-sm text-gray-500 mb-4">
        Note: This proof will be saved only to your device's browser storage.
      </p>
      
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
            Image Proof*
          </label>
          <input
            id="proof-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max file size: 5MB. Accepted formats: JPEG, PNG, GIF, WEBP.
          </p>
        </div>
        
        {previewUrl && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <div className="border rounded-md p-2 bg-gray-50">
              <img 
                src={previewUrl} 
                alt="Preview" 
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
          {isSubmitting ? 'Saving...' : 'Save Proof Locally'}
        </button>
      </form>
    </motion.div>
  );
};

export default ProofSubmissionForm;