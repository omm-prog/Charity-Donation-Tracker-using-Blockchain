import React, { useState, useEffect } from "react";
import "../styles/AdminPanel.css";
import { ethers } from "ethers";
import { useContract } from "../context/ContractContext";
import { motion } from "framer-motion";

const AdminPanel = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifyingCampaign, setVerifyingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const { contract } = useContract();

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // State for proof modal
  const [selectedProof, setSelectedProof] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);

  // Cleanup function for file URLs
  useEffect(() => {
    // Cleanup function to revoke object URLs when modal is closed
    return () => {
      if (selectedProof && selectedProof.fileUrl) {
        URL.revokeObjectURL(selectedProof.fileUrl);
      }
    };
  }, [selectedProof]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchCampaigns();
  }, [contract]);

  const fetchCampaigns = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const campaignCount = await contract.campaignCount();
      const campaignsData = [];

      // Get proof data from localStorage
      const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');

      for (let i = 0; i < campaignCount; i++) {
        const campaign = await contract.campaigns(i);
        const campaignData = {
          id: i,
          name: campaign.name,
          description: campaign.description,
          goal: ethers.formatEther(campaign.goal),
          raised: ethers.formatEther(campaign.balance),
          deadline: new Date(Number(campaign.deadline) * 1000),
          createdAt: Number(campaign.deadline) - (25), // Creation time (deadline - duration)
          owner: campaign.owner,
          state: ["Active", "Successful", "Failed"][campaign.state],
          proofData: proofs[i] || null
        };
        campaignsData.push(campaignData);
      }

      setCampaigns(campaignsData);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleProofVerification = async (campaignId) => {
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    setVerifyingCampaign(campaignId);
    setLoading(true);

    try {
      // Update proof verification in localStorage
      const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');
      if (proofs[campaignId]) {
        proofs[campaignId].verified = true;
        proofs[campaignId].verifiedAt = Date.now();
        proofs[campaignId].verifiedBy = "Admin"; // You can replace with actual admin info if available
        localStorage.setItem('campaignProofs', JSON.stringify(proofs));
      } else {
        throw new Error("Proof not found");
      }

      // Refresh campaigns after verification
      await fetchCampaigns();
      setSelectedCampaign(null);
      setShowProofModal(false);

      setNotification({
        message: "Proof verified successfully!",
        type: "success"
      });
    } catch (err) {
      console.error("Error verifying proof:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setVerifyingCampaign(null);
    }
  };

  const handleViewProof = (campaign) => {
    setSelectedProof(campaign.proofData);
    setSelectedCampaign(campaign);
    setShowProofModal(true);
  };

  // Filter and sort campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    if (searchTerm && !campaign.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (statusFilter === "pending_proof") {
      return campaign.proofSubmitted && !campaign.proofVerified;
    } else if (statusFilter === "verified") {
      return campaign.proofVerified;
    } else if (statusFilter === "waiting_proof") {
      return !campaign.proofSubmitted;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.createdAt - a.createdAt;
      case "oldest":
        return a.createdAt - b.createdAt;
      case "highest_goal":
        return parseFloat(b.goal) - parseFloat(a.goal);
      case "lowest_goal":
        return parseFloat(a.goal) - parseFloat(b.goal);
      default:
        return 0;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="admin-panel">
      <h2>Campaign Management Dashboard</h2>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Campaigns</option>
            <option value="waiting_proof">Waiting for Proof</option>
            <option value="pending_proof">Pending Verification</option>
            <option value="verified">Verified</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_goal">Highest Goal</option>
            <option value="lowest_goal">Lowest Goal</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="campaigns-grid">
        {paginatedCampaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-card">
            <h3>{campaign.name}</h3>
            <p className="description">{campaign.description}</p>
            <div className="campaign-details">
              <p>Goal: {campaign.goal} ETH</p>
              <p>Raised: {campaign.raised} ETH</p>
              <p>Status: {campaign.state}</p>
              <p>Deadline: {campaign.deadline.toLocaleDateString()}</p>
            </div>
            
            <div className="proof-status">
              {campaign.proofData ? (
                <>
                  <p>Proof Status: {campaign.proofData.verified ? 'Verified' : 'Pending Verification'}</p>
                  <div className="proof-actions">
                    <button 
                      className="view-proof-btn"
                      onClick={() => handleViewProof(campaign)}
                    >
                      View Proof
                    </button>
                    {!campaign.proofData.verified && (
                      <button 
                        className="verify-btn"
                        onClick={() => handleProofVerification(campaign.id)}
                        disabled={verifyingCampaign === campaign.id}
                      >
                        {verifyingCampaign === campaign.id ? 'Verifying...' : 'Verify Proof'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p>No proof submitted yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Proof Modal */}
      {showProofModal && selectedProof && (
        <div className="proof-modal">
          <div className="modal-content">
            <h3>Proof Details</h3>
            <div className="proof-info">
              <p><strong>Campaign:</strong> {selectedCampaign.name}</p>
              <p><strong>Submitted By:</strong> {selectedProof.owner || selectedProof.submittedBy}</p>
              <p><strong>Submission Date:</strong> {new Date(selectedProof.timestamp || selectedProof.submittedAt).toLocaleString()}</p>
              <p><strong>Description:</strong> {selectedProof.description}</p>
              
              <div className="proof-file-container" style={{
                marginTop: "1.5rem",
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: "#f9f9fb",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
              }}>
                {selectedProof.fileUrl && selectedProof.fileType && selectedProof.fileType.startsWith('image/') ? (
                  <img 
                    src={selectedProof.fileUrl} 
                    alt="Proof" 
                    style={{
                      maxWidth: "100%",
                      maxHeight: "400px",
                      display: "block",
                      margin: "0 auto",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }} 
                  />
                ) : selectedProof.fileUrl && selectedProof.fileType === 'application/pdf' ? (
                  <iframe
                    src={selectedProof.fileUrl}
                    title="PDF Proof"
                    style={{
                      width: "100%",
                      height: "400px",
                      border: "none",
                      borderRadius: "4px"
                    }}
                  ></iframe>
                ) : selectedProof.fileUrl ? (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "2rem"
                  }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <p style={{ 
                      fontWeight: "500", 
                      marginBottom: "0.5rem" 
                    }}>
                      {selectedProof.filename || "Document File"}
                    </p>
                    <button
                      onClick={() => window.open(selectedProof.fileUrl, '_blank')}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#4a4a4a",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "0.5rem"
                      }}
                    >
                      View File
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                    No preview available for this file type
                  </div>
                )}
              </div>
              
              <div style={{ 
                marginTop: "1.5rem", 
                padding: "0.75rem", 
                backgroundColor: selectedProof.verified ? "#e6f7ee" : "#fff9e6",
                borderRadius: "6px",
                borderLeft: `4px solid ${selectedProof.verified ? "#00b894" : "#fdcb6e"}` 
              }}>
                <p style={{ margin: 0 }}>
                  <strong>Status:</strong> 
                  <span style={{ 
                    marginLeft: "0.5rem",
                    color: selectedProof.verified ? "#00b894" : "#fdcb6e"
                  }}>
                    {selectedProof.verified ? "Verified" : "Pending Verification"}
                  </span>
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                {!selectedProof.verified && (
                  <button 
                    onClick={() => handleProofVerification(selectedCampaign.id)}
                    style={{
                      padding: "0.5rem 1.5rem",
                      backgroundColor: "#00b894",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    Verify Proof
                  </button>
                )}
                <button 
                  onClick={() => setShowProofModal(false)}
                  style={{
                    padding: "0.5rem 1.5rem",
                    backgroundColor: selectedProof.verified ? "#6c5ce7" : "#718096",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;