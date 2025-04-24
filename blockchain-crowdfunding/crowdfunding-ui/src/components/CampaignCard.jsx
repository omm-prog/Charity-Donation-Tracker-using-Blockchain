import React, { useEffect, useState } from "react";
import { useContract } from "../context/ContractContext";

const CampaignCard = ({ 
  campaign = {}, 
  onWithdraw, 
  onVerifyProofs, 
  onVerifyCampaign,
  onInvoiceFileChange,
  invoiceAnalysis,
  loading,
  onDonate
}) => {
  const { contract } = useContract();
  const [campaignCount, setCampaignCount] = useState(0);

  useEffect(() => {
    const fetchCampaignCount = async () => {
      if (!contract) {
        console.error('Contract not initialized');
        return;
      }

      try {
        const count = await contract.campaignCount();
        console.log('Total campaigns:', Number(count));
        setCampaignCount(Number(count));
      } catch (error) {
        console.error('Error fetching campaign count:', error);
      }
    };

    fetchCampaignCount();
  }, [contract]);

  // Provide default values for campaign properties
  const {
    name = "Unnamed Campaign",
    description = "No description provided",
    goal = "0",
    raised = "0",
    state = "Unknown",
    deadline = "",
    createdAt = "",
    verified = false,
    id = ""
  } = campaign;

  // Format the creation date if it exists, otherwise use deadline as fallback or "Unknown"
  const formattedCreationDate = createdAt && createdAt !== "" 
    ? new Date(Number(createdAt) * 1000).toLocaleString() 
    : deadline && deadline !== "" 
      ? `Approx. ${new Date(Number(deadline) * 1000 - 25000).toLocaleString()}`
      : "Unknown";

  const statusClass = state ? state.toLowerCase() : "unknown";

  return (
    <div className={`campaign-card ${statusClass}`}>
      <div className="campaign-header">
        <h3>{name}</h3>
        <span className={`status-badge ${statusClass}`}>
          {state}
        </span>
      </div>
      
      <p className="campaign-description">{description}</p>
      
      <div className="campaign-stats">
        <div className="stat-item">
          <span className="stat-label">Goal:</span>
          <span className="stat-value">{goal} ETH</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Raised:</span>
          <span className="stat-value">{raised} ETH</span>
        </div>
        {deadline && (
          <div className="stat-item">
            <span className="stat-label">Deadline:</span>
            <span className="stat-value">{deadline}</span>
          </div>
        )}
        <div className="stat-item">
          <span className="stat-label">Created:</span>
          <span className="stat-value">{formattedCreationDate}</span>
        </div>
      </div>

      <div className="campaign-actions">
        {state === "Active" && (
          <button 
            onClick={() => onDonate(id)}
            className="btn btn-primary donate-button"
            disabled={loading?.donate}
          >
            {loading?.donate ? "Processing..." : "Donate Now"}
          </button>
        )}

        {state === "Successful" && (
          <div className="proof-verification-section">
            <h4>Proof Verification</h4>
            
            {!invoiceAnalysis ? (
              <>
                <div className="file-upload">
                  <label>
                    Upload Invoices:
                    <input 
                      type="file" 
                      multiple 
                      onChange={onInvoiceFileChange}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                    />
                  </label>
                </div>
                
                <button 
                  onClick={onVerifyProofs}
                  disabled={loading?.verifyProofs}
                  className="btn btn-primary"
                >
                  {loading?.verifyProofs ? "Analyzing..." : "Verify Proofs"}
                </button>
              </>
            ) : (
              <div className="analysis-results">
                <h5>Analysis Results</h5>
                <ul>
                  <li>
                    <strong>Files Processed:</strong> {invoiceAnalysis.total_files || 0}
                  </li>
                  <li>
                    <strong>Meets Conditions:</strong> 
                    {invoiceAnalysis.meets_conditions ? " ✅" : " ❌"}
                  </li>
                </ul>
                
                {invoiceAnalysis.meets_conditions && !verified && (
                  <button 
                    onClick={onVerifyCampaign}
                    disabled={loading?.verifyCampaign}
                    className="btn btn-success"
                  >
                    {loading?.verifyCampaign ? "Processing..." : "Verify Campaign"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {verified && parseFloat(raised) >= parseFloat(goal) && (
          <button 
            onClick={onWithdraw}
            disabled={loading?.withdraw}
            className="btn btn-withdraw"
          >
            {loading?.withdraw ? "Processing..." : "Withdraw Funds"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CampaignCard;