import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

function ProofVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { campaignId, campaignName } = location.state || {};
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(selectedFile.type)) {
      alert("Only JPG, PNG, or PDF files are allowed");
      return;
    }
    
    setFile(selectedFile);
    setVerificationStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !description.trim()) {
      alert("Please provide both a proof file and description");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate verification process (in a real app, this would be done by admin)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store proof in localStorage
      const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');
      proofs[campaignId] = {
        filename: file.name,
        filePath: URL.createObjectURL(file),
        description,
        timestamp: new Date().getTime(),
        campaignName,
        verified: true // In a real app, this would be set to false initially and verified by admin
      };
      localStorage.setItem('campaignProofs', JSON.stringify(proofs));

      setVerificationStatus("success");
      setTimeout(() => navigate("/ngo-dashboard"), 1500);
    } catch (error) {
      console.error("Error submitting proof:", error);
      setVerificationStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!campaignId || !campaignName) {
    return (
      <div className="proof-verification-container">
        <div className="proof-verification-card error-state">
          <h2>Invalid Campaign</h2>
          <p>No campaign specified for proof submission.</p>
          <button 
            className="back-button"
            onClick={() => navigate("/ngo-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="proof-verification-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="proof-verification-card">
        <h2>Submit Proof for {campaignName}</h2>
        
        {verificationStatus === "success" ? (
          <div className="verification-success">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 4L12 14.01l-3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Proof Submitted Successfully!</h3>
            <p>Your proof has been submitted and verified.</p>
          </div>
        ) : verificationStatus === "error" ? (
          <div className="verification-error">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Submission Failed</h3>
            <p>There was an error submitting your proof. Please try again.</p>
            <button 
              className="try-again-button"
              onClick={() => setVerificationStatus(null)}
            >
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Upload Proof (PDF, JPG, PNG)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />
              {file && (
                <div className="file-preview">
                  <p>Selected: {file.name}</p>
                  {file.type.startsWith("image/") && (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      style={{ maxWidth: "100%", maxHeight: "200px" }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how the funds were used..."
                required
              />
            </div>

            <div className="button-group">
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/ngo-dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

export default ProofVerification;