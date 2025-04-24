// import React from 'react';
// import { updateProofVerification } from '../utils/proofUtils';
// import '../styles/ProofViewer.css';

// const ProofViewer = ({ proof, campaignName, onClose, onVerify }) => {
//   const handleVerification = (verified) => {
//     if (updateProofVerification(proof.campaignId, verified)) {
//       onVerify(proof.campaignId, verified);
//     }
//   };

//   // Format date for display
//   const formatDate = (timestamp) => {
//     if (!timestamp) return 'Unknown date';
//     return new Date(timestamp).toLocaleString();
//   };

//   return (
//     <div className="proof-viewer">
//       <div className="proof-viewer-content">
//         <div className="proof-viewer-header">
//           <h2>Proof Details - {campaignName}</h2>
//           <button className="close-button" onClick={onClose}>×</button>
//         </div>

//         <div className="proof-info">
//           <p><strong>Submitted by:</strong> {proof.submittedBy || 'Unknown'}</p>
//           <p><strong>Date:</strong> {formatDate(proof.timestamp)}</p>
//           <p><strong>Status:</strong> 
//             <span className={`status-badge ${proof.verified ? 'verified' : 'pending'}`}>
//               {proof.verified ? 'Verified' : 'Pending Verification'}
//             </span>
//           </p>
//           {proof.verified && (
//             <>
//               <p><strong>Verified by:</strong> {proof.verifiedBy || 'Admin'}</p>
//               <p><strong>Verified on:</strong> {formatDate(proof.verifiedAt)}</p>
//             </>
//           )}
//         </div>

//         <div className="proof-description">
//           <h3>Description</h3>
//           <p>{proof.description || 'No description provided'}</p>
//         </div>

//         <div className="proof-file">
//           <h3>Proof File</h3>
//           {proof.fileType && proof.fileType.startsWith('image/') ? (
//             <div className="image-container">
//               <img src={proof.file} alt="Proof" className="proof-image" />
//             </div>
//           ) : (
//             <div className="file-preview">
//               <p>File: {proof.fileName || 'Unknown file'}</p>
//               {proof.file && (
//                 <a href={proof.file} target="_blank" rel="noopener noreferrer" className="view-file-button">
//                   View File
//                 </a>
//               )}
//             </div>
//           )}
//         </div>

//         {!proof.verified && (
//           <div className="verification-actions">
//             <button 
//               className="verify-button success"
//               onClick={() => handleVerification(true)}
//             >
//               Verify Proof
//             </button>
//             <button 
//               className="verify-button danger"
//               onClick={() => handleVerification(false)}
//             >
//               Reject Proof
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProofViewer; 

import React from 'react';
import '../styles/ProofViewer.css';

const ProofViewer = ({ proof, campaignName, onClose }) => {
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="proof-viewer">
      <div className="proof-viewer-content">
        <div className="proof-viewer-header">
          <h2>Proof Details - {campaignName}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="proof-info">
          <p><strong>Submitted by:</strong> {proof.walletAddress || 'Unknown'}</p>
          <p><strong>Date:</strong> {formatDate(proof.timestamp)}</p>
          <p><strong>Storage:</strong> 
            <span className="status-badge local">
              Locally Stored
            </span>
          </p>
        </div>

        <div className="proof-description">
          <h3>Description</h3>
          <p>{proof.description || 'No description provided'}</p>
        </div>

        <div className="proof-file">
          <h3>Proof Image</h3>
          {proof.image ? (
            <div className="image-container">
              <img src={proof.image} alt="Proof" className="proof-image" />
            </div>
          ) : (
            <div className="file-preview">
              <p>No image available</p>
            </div>
          )}
        </div>

        <div className="local-storage-note">
          <p>Note: This proof is stored only in your browser's local storage and cannot be verified by others.</p>
        </div>
      </div>
    </div>
  );
};

export default ProofViewer;