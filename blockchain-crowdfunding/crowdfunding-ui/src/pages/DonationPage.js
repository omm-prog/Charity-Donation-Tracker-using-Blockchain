import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContract } from '../context/ContractContext';
import { useCurrency } from '../context/CurrencyContext';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import ToastNotification from '../components/ToastNotification';
import '../styles/DonationPage.css';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const DonationPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { contract, error: contractError, currentAccount } = useContract();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [ngoProfile, setNgoProfile] = useState(null);

  useEffect(() => {
    if (contractError) {
      setError(contractError);
      setLoading(false);
      return;
    }
    if (contract && campaignId) {
      fetchCampaign();
    }
  }, [contract, contractError, campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Please connect your wallet to view campaign details');
      }

      const campaignData = await contract.campaigns(campaignId);
      const goal = ethers.formatEther(campaignData.goal || '0');
      const raised = ethers.formatEther(campaignData.balance || '0');
      
      setCampaign({
        id: campaignId,
        name: campaignData.name,
        description: campaignData.description,
        goal: goal,
        raised: raised,
        deadline: new Date(Number(campaignData.deadline) * 1000).toLocaleDateString(),
        state: ["Active", "Successful", "Failed"][Number(campaignData.state)],
        owner: campaignData.owner,
        rawGoal: campaignData.goal,
        rawBalance: campaignData.balance,
        createdAt: new Date(Number(campaignData.deadline) * 1000 - (Number(campaignData.duration) * 24 * 60 * 60 * 1000)).toLocaleDateString()
      });

      // Fetch NGO profile data from Firestore
      try {
        const ngoProfilesRef = collection(db, 'ngoProfiles');
        const q = query(ngoProfilesRef, where('walletAddress', '==', campaignData.owner.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const ngoData = querySnapshot.docs[0].data();
          setNgoProfile(ngoData);
        }
      } catch (err) {
        console.error('Error fetching NGO profile:', err);
      }
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setDonating(true);
    try {
      setError(null);

      // Validate donation amount
      if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
        throw new Error('Please enter a valid donation amount');
      }

      // Ensure contract is initialized
      if (!contract) {
        throw new Error('Contract not initialized. Please try again later.');
      }

      // Convert donation amount to Wei
      const donationInWei = ethers.parseEther(donationAmount);

      // Check if donation exceeds remaining goal using BigInt values
      const remainingInWei = campaign.rawGoal - campaign.rawBalance;
      if (donationInWei > remainingInWei) {
        throw new Error('Donation amount exceeds remaining campaign goal');
      }

      // Send the transaction
      const tx = await contract.contribute(campaign.id, { value: donationInWei });
      await tx.wait();
      
      // Refresh data
      await fetchCampaign();
      setDonationAmount('');
      setNotification({
        message: 'Donation successful! Thank you for your contribution.',
        type: 'success'
      });

    } catch (err) {
      console.error('Error making donation:', err);
      setError(err.message || 'Failed to process donation');
      setNotification({
        message: err.message || 'Failed to process donation. Please try again.',
        type: 'error'
      });
    } finally {
      setDonating(false);
    }
  };

  const handleBack = () => {
    navigate('/campaigns');
  };

  if (!currentAccount) {
    return (
      <div className="connect-wallet-message">
        <h3>Connect Your Wallet</h3>
        <p>Please connect your wallet to view and interact with campaigns</p>
        <button onClick={handleBack} className="back-button">Back to Campaigns</button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={fetchCampaign} className="retry-button">
          Try Again
        </button>
        <button onClick={handleBack} className="back-button">Back to Campaigns</button>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="not-found">
        <h3>Campaign Not Found</h3>
        <p>The campaign you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleBack} className="back-button">Back to Campaigns</button>
      </div>
    );
  }

  const remainingGoal = parseFloat(campaign.goal) - parseFloat(campaign.raised);
  const progressPercentage = Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100);

  return (
    <div className="donation-page">
      <AnimatePresence>
        {notification && (
          <ToastNotification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>

      <div className="campaign-details">
        <motion.div
          className="campaign-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-header">
            <h2>{campaign.name}</h2>
            <span className={`status-badge ${campaign.state.toLowerCase()}`}>
              {campaign.state}
            </span>
          </div>

          <div className="campaign-info">
            <div className="campaign-description">
              <h3>About this Campaign</h3>
              <p>{campaign.description}</p>
            </div>

            <div className="campaign-meta">
              <div className="meta-item">
                <span className="meta-label">Created</span>
                <span className="meta-value">{campaign.createdAt}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Deadline</span>
                <span className="meta-value">{campaign.deadline}</span>
              </div>
              {ngoProfile && (
                <div className="meta-item ngo-meta">
                  <span className="meta-label">NGO</span>
                  <span className="meta-value">{ngoProfile.name}</span>
                  <button 
                    className="view-profile-link"
                    onClick={() => navigate(`/ngo-profile/${campaign.owner}`)}
                  >
                    View Profile →
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="funding-status">
            <div className="funding-header">
              <h3>Funding Progress</h3>
              <span className="funding-percentage">{progressPercentage.toFixed(1)}% Complete</span>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="funding-stats">
              <div className="stat">
                <span>Raised</span>
                <strong>{convertAmount(campaign.raised, 'ETH')} {selectedCurrency.symbol}</strong>
              </div>
              <div className="stat">
                <span>Goal</span>
                <strong>{convertAmount(campaign.goal, 'ETH')} {selectedCurrency.symbol}</strong>
              </div>
              <div className="stat">
                <span>Remaining</span>
                <strong>{convertAmount(remainingGoal.toString(), 'ETH')} {selectedCurrency.symbol}</strong>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="donation-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="donation-header">
            <h3>Make a Donation</h3>
            <p>Support this campaign by making a contribution</p>
          </div>

          <form onSubmit={handleDonationSubmit} className="donation-form">
            <div className="donation-input-group">
              <label htmlFor="donation-amount">Amount ({selectedCurrency.symbol})</label>
              <div className="input-wrapper">
                <span className="currency-symbol">{selectedCurrency.symbol}</span>
                <input
                  id="donation-amount"
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder={`Enter amount in ${selectedCurrency.symbol}`}
                  min="0"
                  step="0.01"
                  disabled={donating || campaign.state !== "Active"}
                  required
                />
              </div>
            </div>

            {campaign.state === "Active" ? (
              <motion.button
                type="submit"
                className="donate-button"
                disabled={donating || !donationAmount}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {donating ? (
                  <span className="button-loader"></span>
                ) : (
                  'Donate Now'
                )}
              </motion.button>
            ) : (
              <p className="campaign-closed-message">
                This campaign is no longer accepting donations.
              </p>
            )}
          </form>

          {ngoProfile && (
            <div className="ngo-info">
              <h4>About the NGO</h4>
              <p>{ngoProfile.description || 'No description available.'}</p>
              <button 
                className="view-ngo-button"
                onClick={() => navigate(`/ngo/${campaign.owner}`)}
              >
                View NGO Profile
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <button onClick={handleBack} className="back-button">
        Back to Campaigns
      </button>
    </div>
  );
};

export default DonationPage;
