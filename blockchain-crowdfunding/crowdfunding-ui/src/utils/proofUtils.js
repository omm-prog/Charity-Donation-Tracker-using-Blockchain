// proofUtils.js - Utility functions for handling proof files with IndexedDB and Cloudinary

import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { storage, firestore } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, getStorage } from 'firebase/storage';
import CLOUDINARY_CONFIG, { generateUploadUrl } from '../config/cloudinaryConfig';
import { formatEther } from 'ethers';

// Cloudinary configuration from config file
const CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_CONFIG.upload_preset;
const CLOUDINARY_CLOUD_NAME = CLOUDINARY_CONFIG.cloud_name;
const CLOUDINARY_UPLOAD_URL = generateUploadUrl(CLOUDINARY_CLOUD_NAME);

// Get upload preset from localStorage or default
const getUploadPreset = () => {
  const savedPreset = localStorage.getItem('cloudinary_preset');
  return savedPreset || CLOUDINARY_UPLOAD_PRESET;
};

/**
 * Uploads a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} campaignId - The campaign ID for folder organization
 * @returns {Promise<Object>} - The Cloudinary response with image details
 */
export const uploadToCloudinary = async (file, campaignId) => {
  try {
    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (CLOUDINARY_CONFIG.allowed_formats && 
        !CLOUDINARY_CONFIG.allowed_formats.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed. Please upload: ${CLOUDINARY_CONFIG.allowed_formats.join(', ')}`);
    }
    
    // Validate file size
    if (CLOUDINARY_CONFIG.max_file_size && 
        file.size > CLOUDINARY_CONFIG.max_file_size) {
      throw new Error(`File is too large. Maximum size is ${Math.round(CLOUDINARY_CONFIG.max_file_size / (1024 * 1024))}MB`);
    }
    
    // Get the upload preset (from localStorage if available)
    const uploadPreset = getUploadPreset();
    
    // Create a FormData object to send to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    
    // Use upload preset for unsigned uploads
    formData.append('upload_preset', uploadPreset);
    
    // Add API key for authentication
    formData.append('api_key', CLOUDINARY_CONFIG.api_key);
    
    // Organize into folders by campaign ID
    formData.append('folder', `${CLOUDINARY_CONFIG.folder}/${campaignId}`);
    
    // Add public ID with timestamp to ensure uniqueness
    const timestamp = Date.now();
    formData.append('public_id', `proof_${timestamp}`);
    formData.append('timestamp', timestamp.toString());
    
    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary response:', errorText);
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }
    
    // Get the response with image details
    const imageData = await response.json();
    console.log('Image uploaded to Cloudinary:', imageData);
    
    return imageData;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Open IndexedDB database
const openProofsDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProofsDatabase', 1);
    
    // Create object store on first load or version upgrade
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('proofs')) {
        const store = db.createObjectStore('proofs', { keyPath: 'id' });
        store.createIndex('campaignId', 'campaignId', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Save proof file and metadata to IndexedDB
export const saveProof = async (campaignId, file, description, owner, ownerName, campaignName) => {
  try {
    const db = await openProofsDB();
    
    // Convert file to ArrayBuffer for storage
    const fileBuffer = await file.arrayBuffer();
    
    const timestamp = Date.now();
    const id = `${campaignId}_${timestamp}`;
    
    // Create proof object with file data and metadata
    const proofData = {
      id,
      campaignId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: fileBuffer, // Store the actual file data
      description,
      owner,
      ownerName,
      timestamp,
      campaignName,
      verified: false,
      createdAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['proofs'], 'readwrite');
      const store = transaction.objectStore('proofs');
      const request = store.put(proofData);
      
      request.onsuccess = () => {
        console.log('Proof saved successfully to IndexedDB');
        
        // Also update the proof list in localStorage for faster access to metadata
        updateProofMetadataInLocalStorage(campaignId, {
          id,
          filename: file.name,
          fileType: file.type,
          description,
          owner,
          ownerName,
          timestamp,
          campaignName,
          verified: false
        });
        
        resolve(id);
      };
      
      request.onerror = (event) => {
        console.error('Error saving proof:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error in saveProof:', error);
    throw error;
  }
};

// Update proof metadata in localStorage (for quicker access)
const updateProofMetadataInLocalStorage = (campaignId, metadata) => {
  try {
    const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');
    proofs[campaignId] = metadata;
    localStorage.setItem('campaignProofs', JSON.stringify(proofs));
  } catch (error) {
    console.error('Error updating proof metadata in localStorage:', error);
  }
};

// Get proof metadata from localStorage
export const getProofMetadata = (campaignId) => {
  try {
    const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');
    return proofs[campaignId] || null;
  } catch (error) {
    console.error('Error getting proof metadata:', error);
    return null;
  }
};

// Get all proof metadata from localStorage
export const getAllProofMetadata = () => {
  try {
    return JSON.parse(localStorage.getItem('campaignProofs') || '{}');
  } catch (error) {
    console.error('Error getting all proof metadata:', error);
    return {};
  }
};

// Get full proof with file data from IndexedDB
export const getProof = async (campaignId) => {
  try {
    const metadata = getProofMetadata(campaignId);
    if (!metadata) return null;
    
    const db = await openProofsDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['proofs'], 'readonly');
      const store = transaction.objectStore('proofs');
      const request = store.get(metadata.id);
      
      request.onsuccess = () => {
        const proofData = request.result;
        if (proofData) {
          // Create a blob URL for the file data so it can be displayed or downloaded
          const blob = new Blob([proofData.fileData], { type: proofData.fileType });
          proofData.fileUrl = URL.createObjectURL(blob);
        }
        resolve(proofData);
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving proof:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error in getProof:', error);
    return null;
  }
};

// Update proof verification status
export const updateProofVerification = async (campaignId, verified, verifiedBy = null) => {
  try {
    // Update metadata in localStorage
    const metadata = getProofMetadata(campaignId);
    if (!metadata) return false;
    
    metadata.verified = verified;
    metadata.verifiedAt = Date.now();
    metadata.verifiedBy = verifiedBy || "Admin";
    updateProofMetadataInLocalStorage(campaignId, metadata);
    
    // Update data in IndexedDB
    const db = await openProofsDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['proofs'], 'readwrite');
      const store = transaction.objectStore('proofs');
      const request = store.get(metadata.id);
      
      request.onsuccess = () => {
        const proofData = request.result;
        if (proofData) {
          proofData.verified = verified;
          proofData.verifiedAt = Date.now();
          proofData.verifiedBy = verifiedBy || "Admin";
          
          const updateRequest = store.put(proofData);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = (event) => {
            console.error('Error updating proof verification:', event.target.error);
            reject(event.target.error);
          };
        } else {
          resolve(false);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving proof for verification update:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error in updateProofVerification:', error);
    return false;
  }
};

// Delete a proof
export const deleteProof = async (campaignId) => {
  try {
    // Get metadata from localStorage
    const metadata = getProofMetadata(campaignId);
    if (!metadata) return false;
    
    // Remove from localStorage
    const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');
      delete proofs[campaignId];
    localStorage.setItem('campaignProofs', JSON.stringify(proofs));
    
    // Remove from IndexedDB
    const db = await openProofsDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['proofs'], 'readwrite');
      const store = transaction.objectStore('proofs');
      const request = store.delete(metadata.id);
      
      request.onsuccess = () => {
        console.log('Proof deleted successfully');
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting proof:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error in deleteProof:', error);
    return false;
  }
};

// Export a proof file (for downloading)
export const exportProofFile = async (campaignId) => {
  try {
    const proof = await getProof(campaignId);
    if (!proof) return null;
    
    // Create a download link
    const blob = new Blob([proof.fileData], { type: proof.fileType });
    const url = URL.createObjectURL(blob);
    
    // Create an anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = proof.filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
      return true;
  } catch (error) {
    console.error('Error exporting proof file:', error);
    return false;
  }
};

// Display a proof file
export const displayProofFile = async (campaignId, elementId) => {
  try {
    const proof = await getProof(campaignId);
    if (!proof) return false;
    
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    // Handle different file types
    if (proof.fileType.startsWith('image/')) {
      element.innerHTML = `<img src="${proof.fileUrl}" alt="Proof" style="max-width: 100%;">`;
    } else if (proof.fileType === 'application/pdf') {
      element.innerHTML = `<iframe src="${proof.fileUrl}" style="width: 100%; height: 500px;"></iframe>`;
    } else {
      element.innerHTML = `
        <div>
          <p>File: ${proof.filename}</p>
          <p>Type: ${proof.fileType}</p>
          <p>Size: ${Math.round(proof.fileSize / 1024)} KB</p>
          <button onclick="window.open('${proof.fileUrl}', '_blank')">View File</button>
        </div>
      `;
    }
    
    return true;
  } catch (error) {
    console.error('Error displaying proof file:', error);
    return false;
  }
};

// Utility functions for proof verification and management

/**
 * Saves proof metadata to Firestore
 * @param {Object} proofData - The proof data to save
 * @param {string} proofData.campaignId - The campaign ID this proof is for
 * @param {string} proofData.description - Text description of the proof
 * @param {string} proofData.fileData - Base64 encoded file data
 * @param {string} proofData.fileName - Original file name
 * @param {string} proofData.fileType - MIME type of the file
 * @param {string} proofData.submittedBy - Wallet address of the submitter
 * @returns {Promise<string>} - Promise resolving to the ID of the saved proof document
 */
export const saveProofMetadata = async (proofData) => {
  try {
    const proofRef = await addDoc(collection(db, 'proofs'), {
      ...proofData,
      submittedAt: serverTimestamp(),
      status: 'pending', // 'pending', 'approved', 'rejected'
    });
    
    console.log('Proof saved with ID:', proofRef.id);
    return proofRef.id;
  } catch (error) {
    console.error('Error saving proof metadata:', error);
    throw new Error('Failed to save proof metadata');
  }
};

/**
 * Fetches proofs for a specific campaign
 * @param {string} campaignId - The campaign ID to fetch proofs for
 * @returns {Promise<Array>} - Promise resolving to an array of proof documents
 */
export const getProofsForCampaign = async (campaignId) => {
  try {
    const proofQuery = query(
      collection(db, 'proofs'), 
      where('campaignId', '==', campaignId)
    );
    
    const querySnapshot = await getDocs(proofQuery);
    const proofs = [];
    
    querySnapshot.forEach((doc) => {
      proofs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return proofs;
  } catch (error) {
    console.error('Error fetching proofs:', error);
    throw new Error('Failed to fetch proofs');
  }
};

/**
 * Converts file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Human-readable file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Submits a new proof for a campaign and uploads to Cloudinary
 * @param {Object} params - The proof submission parameters
 * @param {string} params.campaignId - The campaign ID
 * @param {string} params.title - The proof title
 * @param {string} params.description - The proof description
 * @param {File} params.file - The file to upload
 * @param {string} params.currentAccount - The wallet address of the submitter
 * @returns {Promise<string>} - The proof ID
 */
export const submitProof = async ({
  campaignId,
  title,
  description,
  file,
  currentAccount
}) => {
  if (!campaignId || !title || !description || !file || !currentAccount) {
    throw new Error('Missing required fields for proof submission');
  }

  try {
    // 1. First, verify if the submitter is authorized (campaign owner or admin)
    const campaignRef = collection(db, 'campaigns');
    const campaignQuery = query(campaignRef, where('campaignId', '==', campaignId));
    const campaignSnapshot = await getDocs(campaignQuery);
    
    if (campaignSnapshot.empty) {
      throw new Error('Campaign not found');
    }
    
    const campaignData = campaignSnapshot.docs[0].data();
    const isAuthorized = campaignData.owner.toLowerCase() === currentAccount.toLowerCase();
    
    if (!isAuthorized) {
      throw new Error('You are not authorized to submit proof for this campaign');
    }

    // 2. Upload the file to Cloudinary
    let cloudinaryData = null;
    let fileUrl = '';
    
    try {
      // Upload to Cloudinary
      cloudinaryData = await uploadToCloudinary(file, campaignId);
      fileUrl = cloudinaryData.secure_url;
      console.log('File uploaded to Cloudinary:', fileUrl);
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local storage:', err);
      
      // Create a local file URL using object URL as fallback
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      fileUrl = URL.createObjectURL(blob);
    }

    // 3. Also save to IndexedDB for local backup
    await saveProof(campaignId, file, description, currentAccount, currentAccount, title || 'Campaign Proof');

    // 4. Store proof metadata in Firestore
    const proofData = {
      campaignId,
      title,
      description,
      fileUrl, // Cloudinary URL or local blob URL
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      submittedBy: currentAccount,
      submittedAt: serverTimestamp(),
      status: 'pending', // pending, approved, rejected
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      cloudinaryData: cloudinaryData // Store all Cloudinary response data
    };

    const proofsCollection = collection(db, 'proofs');
    const docRef = await addDoc(proofsCollection, proofData);
    
    // 5. Update the campaign with the latest proof ID
    const campaignDocRef = doc(db, 'campaigns', campaignSnapshot.docs[0].id);
    await updateDoc(campaignDocRef, {
      hasProof: true,
      lastProofId: docRef.id,
      lastProofSubmittedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error submitting proof:', error);
    throw new Error(error.message || 'Failed to submit proof');
  }
};

/**
 * Fetches all proofs for a campaign
 * @param {string} campaignId - The campaign ID
 * @returns {Promise<Array>} - Array of proof objects
 */
export const fetchProofsForCampaign = async (campaignId) => {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  try {
    const proofsRef = collection(db, 'proofs');
    const proofsQuery = query(
      proofsRef, 
      where('campaignId', '==', campaignId),
      orderBy('submittedAt', 'desc')
    );
    
    const proofsSnapshot = await getDocs(proofsQuery);
    
    return proofsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate() || null,
      approvedAt: doc.data().approvedAt?.toDate() || null,
      rejectedAt: doc.data().rejectedAt?.toDate() || null
    }));
  } catch (error) {
    console.error('Error fetching proofs:', error);
    throw new Error('Failed to fetch proofs');
  }
};

/**
 * Fetches a single proof by ID
 * @param {string} proofId - The proof ID
 * @returns {Promise<Object>} - The proof object
 */
export const fetchProofById = async (proofId) => {
  if (!proofId) {
    throw new Error('Proof ID is required');
  }

  try {
    const proofRef = doc(db, 'proofs', proofId);
    const proofSnapshot = await getDoc(proofRef);
    
    if (!proofSnapshot.exists()) {
      throw new Error('Proof not found');
    }
    
    const proofData = proofSnapshot.data();
    return {
      id: proofSnapshot.id,
      ...proofData,
      submittedAt: proofData.submittedAt?.toDate() || null,
      approvedAt: proofData.approvedAt?.toDate() || null,
      rejectedAt: proofData.rejectedAt?.toDate() || null
    };
  } catch (error) {
    console.error('Error fetching proof:', error);
    throw new Error('Failed to fetch proof');
  }
};

/**
 * Updates the status of a proof
 * @param {Object} params - The parameters for updating a proof
 * @param {string} params.proofId - The proof ID
 * @param {string} params.status - The new status (approved or rejected)
 * @param {string} params.currentAccount - The wallet address of the reviewer
 * @param {string} params.reason - The reason for rejection (required if status is 'rejected')
 * @returns {Promise<void>}
 */
export const updateProofStatus = async ({
  proofId, 
  status, 
  currentAccount, 
  reason = null
}) => {
  if (!proofId || !status || !currentAccount) {
    throw new Error('Missing required fields for updating proof status');
  }

  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('Status must be either approved or rejected');
  }

  if (status === 'rejected' && !reason) {
    throw new Error('Reason is required when rejecting a proof');
  }

  try {
    const proofRef = doc(db, 'proofs', proofId);
    const proofSnapshot = await getDoc(proofRef);
    
    if (!proofSnapshot.exists()) {
      throw new Error('Proof not found');
    }
    
    const proofData = proofSnapshot.data();
    const campaignId = proofData.campaignId;
    
    // Verify if the reviewer is authorized (admin or contract owner)
    // For simplicity, we allow anyone to update the status for now
    // In a production environment, you would want to implement proper authorization
    
    const updateData = {};
    
    if (status === 'approved') {
      updateData.status = 'approved';
      updateData.approvedBy = currentAccount;
      updateData.approvedAt = serverTimestamp();
    } else {
      updateData.status = 'rejected';
      updateData.rejectedBy = currentAccount;
      updateData.rejectedAt = serverTimestamp();
      updateData.rejectionReason = reason;
    }
    
    await updateDoc(proofRef, updateData);
    
    // If approved, update the campaign status
    if (status === 'approved') {
      const campaignRef = collection(db, 'campaigns');
      const campaignQuery = query(campaignRef, where('campaignId', '==', campaignId));
      const campaignSnapshot = await getDocs(campaignQuery);
      
      if (!campaignSnapshot.empty) {
        const campaignDocRef = doc(db, 'campaigns', campaignSnapshot.docs[0].id);
        await updateDoc(campaignDocRef, {
          proofApproved: true,
          proofApprovedBy: currentAccount,
          proofApprovedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error updating proof status:', error);
    throw new Error('Failed to update proof status');
  }
};

const safeFormatEther = (value) => {
  try {
    if (!value || value === '0') return '0';
    return formatEther(value);
  } catch (error) {
    console.error('Error formatting ether value:', error);
    return '0';
  }
}; 

// Export the utility function
export { safeFormatEther }; 