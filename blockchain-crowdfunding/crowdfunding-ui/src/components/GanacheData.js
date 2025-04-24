// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { useContract } from '../context/ContractContext';
// import { useCurrency } from '../context/CurrencyContext';
// import { ethers } from 'ethers';
// import { motion, AnimatePresence } from 'framer-motion';
// import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
// import { db } from "../firebaseConfig";
// import ToastNotification from './ToastNotification';
// import LoadingSpinner from './LoadingSpinner';
// import ProofSubmissionForm from './ProofSubmissionForm';
// import '../styles/GanacheData.css';

// const ITEMS_PER_PAGE = 5;

// const GanacheData = ({ currentAccount }) => {
//   const { contract, provider, error: contractError } = useContract();
//   const { selectedCurrency, convertAmount } = useCurrency();
//   const [campaigns, setCampaigns] = useState([]);
//   const [selectedCampaign, setSelectedCampaign] = useState(null);
//   const [contributors, setContributors] = useState([]);
//   const [adminAddress, setAdminAddress] = useState('');
//   const [isPaused, setIsPaused] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [donationAmount, setDonationAmount] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalCampaigns, setTotalCampaigns] = useState(0);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [sortBy, setSortBy] = useState('newest');
//   const [donating, setDonating] = useState(false);
//   const [notification, setNotification] = useState(null);
//   const [withdrawing, setWithdrawing] = useState(false);
//   const [showProofSubmission, setShowProofSubmission] = useState(false);
//   const [selectedCampaignForProof, setSelectedCampaignForProof] = useState(null);

//   useEffect(() => {
//     if (contractError) {
//       setError(contractError);
//       setLoading(false);
//       return;
//     }
//     fetchData();
//   }, [contract, contractError]);

//   const getNGONameFromWallet = async (walletAddress) => {
//     try {
//       // Query ngoProfiles collection using wallet address
//       const ngoProfilesRef = collection(db, "ngoProfiles");
//       const q = query(ngoProfilesRef, where("walletAddress", "==", walletAddress));
//       const ngoSnapshot = await getDocs(q);
      
//       if (!ngoSnapshot.empty) {
//         // Get the name directly from ngoProfiles
//         return ngoSnapshot.docs[0].data().name || "Unknown NGO";
//       }
//       return "Unknown NGO";
//     } catch (error) {
//       console.error("Error fetching NGO name:", error);
//       return "Unknown NGO";
//     }
//   };

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       if (!contract) {
//         console.error('Contract not initialized');
//         throw new Error('Contract not initialized');
//       }

//       // Log contract details
//       console.log('Contract address:', contract.target);
//       console.log('Contract provider:', contract.provider);
//       console.log('Contract signer:', contract.signer);

//       console.log('Fetching campaign count...');
//       // Fetch total campaign count
//       const count = await contract.campaignCount();
//       console.log('Total campaigns:', Number(count));
//       setTotalCampaigns(Number(count));

//       if (Number(count) === 0) {
//         console.log('No campaigns found');
//         setCampaigns([]);
//         setLoading(false);
//         return;
//       }

//       // Calculate start and end indices for current page
//       const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//       const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, Number(count));
//       console.log(`Fetching campaigns from index ${startIndex} to ${endIndex}`);
      
//       // Fetch campaigns for current page
//       const campaignsData = [];
//       for (let i = startIndex; i < endIndex; i++) {
//         try {
//           console.log(`Fetching campaign ${i}...`);
//           const campaign = await contract.campaigns(i);
//           console.log(`Campaign ${i} data:`, campaign);
          
//           const goal = ethers.formatEther(campaign.goal || '0');
//           const raised = ethers.formatEther(campaign.balance || '0');
          
//           // Get NGO name using wallet address
//           const ngoName = await getNGONameFromWallet(campaign.owner);
          
//           campaignsData.push({
//             id: i,
//             name: campaign.name,
//             description: campaign.description,
//             goal: goal,
//             raised: raised,
//             deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
//             completed: campaign.completed,
//             state: ["Active", "Successful", "Failed"][Number(campaign.state)],
//             timestamp: Number(campaign.createdAt || campaign.deadline) * 1000,
//             rawGoal: campaign.goal,
//             rawBalance: campaign.balance,
//             owner: campaign.owner,
//             ngoName: ngoName
//           });
//         } catch (campaignErr) {
//           console.error(`Error fetching campaign ${i}:`, campaignErr);
//           continue;
//         }
//       }

//       // Sort by creation time (newest first)
//       campaignsData.sort((a, b) => b.timestamp - a.timestamp);
      
//       console.log('Fetched campaigns:', campaignsData);
//       setCampaigns(campaignsData);

//       // Fetch admin address
//       console.log('Fetching admin address...');
//       const admin = await contract.admin();
//       console.log('Admin address:', admin);
//       setAdminAddress(admin);

//       // Check if contract is paused
//       console.log('Checking if contract is paused...');
//       const paused = await contract.paused();
//       console.log('Contract paused:', paused);
//       setIsPaused(paused);

//     } catch (err) {
//       console.error('Error fetching data:', err);
//       console.error('Error details:', {
//         message: err.message,
//         code: err.code,
//         data: err.data,
//         transaction: err.transaction
//       });
//       setError(err.message);
//       setNotification({
//         message: `Failed to fetch campaign data: ${err.message}`,
//         type: 'error'
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add useEffect to refetch data when page changes
//   useEffect(() => {
//     fetchData();
//   }, [currentPage, contract]);

//   const handleCampaignSelect = async (campaignId) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [contributorAddresses, amounts] = await contract.getContributors(campaignId);
//       const contributorsData = contributorAddresses.map((address, index) => ({
//         address,
//         amount: ethers.formatEther(amounts[index])
//       }));

//       setContributors(contributorsData);
//       setSelectedCampaign(campaigns.find(c => c.id === campaignId));
//     } catch (err) {
//       console.error('Error fetching contributors:', err);
//       setError(err.message);
//       setNotification({
//         message: 'Failed to fetch contributor data. Please try again.',
//         type: 'error'
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDonation = async (e) => {
//     e.preventDefault();
//     setDonating(true);
//     try {
//       setError(null);

//       // Validate donation amount
//       if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
//         throw new Error('Please enter a valid donation amount');
//       }

//       // Ensure contract is initialized
//       if (!contract) {
//         throw new Error('Contract not initialized. Please try again later.');
//       }

//       // Get the selected campaign
//       const campaign = campaigns.find(c => c.id === selectedCampaign.id);
//       if (!campaign) {
//         throw new Error('Campaign not found');
//       }

//       // Convert donation amount to Wei
//       const donationInWei = ethers.parseEther(donationAmount);

//       // Check if donation exceeds remaining goal using BigInt values
//       const remainingInWei = campaign.rawGoal - campaign.rawBalance;
//       if (donationInWei > remainingInWei) {
//         throw new Error('Donation amount exceeds remaining campaign goal');
//       }

//       // Send the transaction
//       const tx = await contract.contribute(selectedCampaign.id, { value: donationInWei });
//       await tx.wait();
      
//       // Refresh data
//       await fetchData();

//       // Reset donation amount and show success message
//       setDonationAmount('');
//       setNotification({
//         message: 'Donation successful! Thank you for your contribution.',
//         type: 'success'
//       });

//       // Close the donation modal
//       setSelectedCampaign(null);
//     } catch (err) {
//       console.error('Error making donation:', err);
//       setError(err.message);
//       setNotification({
//         message: `Failed to make donation: ${err.message}`,
//         type: 'error'
//       });
//     } finally {
//       setDonating(false);
//     }
//   };

//   const handlePageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= totalPages) {
//       setCurrentPage(newPage);
//       // Scroll to top of the page when changing pages
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//     setCurrentPage(1); // Reset to first page on search
//   };

//   const handleSort = (e) => {
//     setSortBy(e.target.value);
//   };

//   // Filter and sort campaigns
//   const filteredAndSortedCampaigns = useMemo(() => {
//     let result = [...campaigns];
    
//     // Apply search filter
//     if (searchTerm) {
//       result = result.filter(campaign => 
//         campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }
    
//     // Apply sorting
//     switch (sortBy) {
//       case 'newest':
//         result.sort((a, b) => b.timestamp - a.timestamp);
//         break;
//       case 'oldest':
//         result.sort((a, b) => a.timestamp - b.timestamp);
//         break;
//       case 'goal-high':
//         result.sort((a, b) => Number(b.goal) - Number(a.goal));
//         break;
//       case 'goal-low':
//         result.sort((a, b) => Number(a.goal) - Number(b.goal));
//         break;
//       default:
//         break;
//     }
    
//     return result;
//   }, [campaigns, searchTerm, sortBy]);

//   const totalPages = Math.ceil(totalCampaigns / ITEMS_PER_PAGE);

//   const handleWithdraw = async (campaignId) => {
//     if (!contract) {
//       setError('Contract not initialized');
//       return;
//     }

//     setWithdrawing(true);
//     try {
//       setError(null);

//       // Estimate gas for the transaction
//       const gasEstimate = await contract.withdrawFunds.estimateGas(campaignId);
      
//       // Add 20% buffer to gas estimate
//       const gasLimit = gasEstimate.mul(120).div(100);
      
//       // Execute the withdrawal
//       const tx = await contract.withdrawFunds(campaignId, { gasLimit });
//       await tx.wait();

//       // Refresh data
//       await fetchData();
//       setNotification({
//         message: 'Funds withdrawn successfully!',
//         type: 'success'
//       });
//     } catch (err) {
//       console.error('Error withdrawing funds:', err);
//       setError(err.message || 'Failed to withdraw funds');
//       setNotification({
//         message: err.message || 'Failed to withdraw funds. Please try again.',
//         type: 'error'
//       });
//     } finally {
//       setWithdrawing(false);
//     }
//   };

//   const handleProofSubmission = (campaignId) => {
//     const campaign = campaigns.find(c => c.id === campaignId);
//     setSelectedCampaignForProof(campaign);
//     setShowProofSubmission(true);
//   };

//   if (loading && !campaigns.length) {
//     return <LoadingSpinner fullPage />;
//   }

//   if (error) {
//     return (
//       <div className="error-container">
//         <div className="error-icon">⚠️</div>
//         <h3>Error</h3>
//         <p>{error}</p>
//         <button onClick={fetchData} className="retry-button">
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="ganache-data">
//       <AnimatePresence>
//         {notification && (
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//           >
//             <ToastNotification
//               message={notification.message}
//               type={notification.type}
//               onClose={() => setNotification(null)}
//             />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="contract-info">
//         <h2>Campaigns</h2>
//         {isPaused && (
//           <div className="paused-warning">
//             ⚠️ Campaigns are currently paused
//           </div>
//         )}
//       </div>

//       <div className="campaigns-controls">
//         <div className="search-sort">
//           <input
//             type="text"
//             placeholder="Search campaigns..."
//             value={searchTerm}
//             onChange={handleSearch}
//             className="search-input"
//           />
//           <select value={sortBy} onChange={handleSort} className="sort-select">
//             <option value="newest">Recently Created</option>
//             <option value="oldest">Oldest First</option>
//             <option value="goal-high">Highest Goal</option>
//             <option value="goal-low">Lowest Goal</option>
//           </select>
//         </div>
//       </div>

//       <div className="campaigns-grid">
//         <AnimatePresence>
//           {filteredAndSortedCampaigns.map((campaign) => (
//             <motion.div
//               key={campaign.id}
//               className={`campaign-card ${campaign.state.toLowerCase()}`}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3 }}
//             >
//               <div className="card-header">
//                 <div className="card-title">
//                   <h3>{campaign.name}</h3>
//                   <div className="ngo-info">
//                     <span className="wallet-address">{campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}</span>
//                     <span className="ngo-name">by {campaign.ngoName}</span>
//                   </div>
//                 </div>
//                 <div className="card-header-actions">
//                   <span className={`status-badge ${campaign.state.toLowerCase()}`}>
//                     {campaign.state}
//                   </span>
//                 </div>
//               </div>
//               <p className="campaign-description">{campaign.description}</p>
//               <div className="campaign-stats">
//                 <div className="stat-item">
//                   <span className="stat-label">Goal:</span>
//                   <span className="stat-value">
//                     {selectedCurrency.symbol}{convertAmount(campaign.goal, 'ETH')}
//                   </span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Raised:</span>
//                   <span className="stat-value">
//                     {selectedCurrency.symbol}{convertAmount(campaign.raised, 'ETH')}
//                   </span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Progress:</span>
//                   <div className="progress-bar">
//                     <div 
//                       className="progress-fill"
//                       style={{ 
//                         width: `${Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100)}%`
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>
//               <div className="card-footer">
//                 <span className="deadline">Deadline: {campaign.deadline}</span>
//                 <button
//                   className="donate-button"
//                   onClick={() => handleCampaignSelect(campaign.id)}
//                   disabled={isPaused || campaign.state !== "Active"}
//                 >
//                   Donate Now
//                 </button>
//               </div>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </div>

//       {totalPages > 1 && (
//         <div className="pagination">
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="page-button"
//           >
//             Previous
//           </button>
//           <div className="page-numbers">
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
//               <button
//                 key={pageNum}
//                 onClick={() => handlePageChange(pageNum)}
//                 className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
//               >
//                 {pageNum}
//               </button>
//             ))}
//           </div>
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="page-button"
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {selectedCampaign && (
//         <motion.div
//           className="campaign-modal"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//         >
//           <div className="modal-content">
//             <h3>{selectedCampaign.name}</h3>
//             <p>{selectedCampaign.description}</p>
            
//             <div className="details-grid">
//               <div className="detail-item">
//                 <span>Goal</span>
//                 <strong>{selectedCurrency.symbol}{convertAmount(selectedCampaign.goal, 'ETH')}</strong>
//               </div>
//               <div className="detail-item">
//                 <span>Raised</span>
//                 <strong>{selectedCurrency.symbol}{convertAmount(selectedCampaign.raised, 'ETH')}</strong>
//               </div>
//               <div className="detail-item">
//                 <span>Deadline</span>
//                 <strong>{selectedCampaign.deadline}</strong>
//               </div>
//               <div className="detail-item">
//                 <span>Status</span>
//                 <strong>{selectedCampaign.state || "Active"}</strong>
//               </div>
//             </div>

//             <div className="contributors-section">
//               <h4>Contributors</h4>
//               {loading ? (
//                 <LoadingSpinner />
//               ) : contributors.length > 0 ? (
//                 <ul className="contributors-list">
//                   {contributors.map((contributor, index) => (
//                     <motion.li
//                       key={index}
//                       className="contributor-item"
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: index * 0.1 }}
//                     >
//                       <span className="contributor-address">
//                         {contributor.address.slice(0, 6)}...{contributor.address.slice(-4)}
//                       </span>
//                       <span className="contributor-amount">{contributor.amount} ETH</span>
//                     </motion.li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="no-contributors">No contributors yet</p>
//               )}
//             </div>

//             <form onSubmit={handleDonation} className="donation-form">
//               <div className="donation-input-group">
//                 <input
//                   type="number"
//                   value={donationAmount}
//                   onChange={(e) => setDonationAmount(e.target.value)}
//                   placeholder="Enter amount in ETH"
//                   min="0"
//                   step="0.01"
//                   disabled={donating}
//                   required
//                 />
//                 <motion.button
//                   type="submit"
//                   disabled={donating || !donationAmount}
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                 >
//                   {donating ? (
//                     <span className="button-loader"></span>
//                   ) : (
//                     'Donate'
//                   )}
//                 </motion.button>
//               </div>
//             </form>

//             <div className="modal-actions">
//               <button onClick={() => setSelectedCampaign(null)}>Close</button>
//             </div>
//           </div>
//         </motion.div>
//       )}

//       {/* Proof Submission Modal */}
//       {showProofSubmission && selectedCampaignForProof && (
//         <div className="modal-overlay" onClick={() => setShowProofSubmission(false)}>
//           <div className="modal-content" onClick={e => e.stopPropagation()}>
//             <ProofSubmissionForm
//               campaignId={selectedCampaignForProof.id}
//               onClose={() => setShowProofSubmission(false)}
//               currentAccount={currentAccount}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default GanacheData; 

import React, { useState, useEffect, useMemo } from 'react';
import { useContract } from '../context/ContractContext';
import { useCurrency } from '../context/CurrencyContext';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ToastNotification from './ToastNotification';
import LoadingSpinner from './LoadingSpinner';
import ProofSubmissionForm from './ProofSubmissionForm';
import '../styles/GanacheData.css';

const ITEMS_PER_PAGE = 5;
const RECENT_CAMPAIGNS_COUNT = 3;

const GanacheData = ({ currentAccount }) => {
  const { contract, provider, error: contractError } = useContract();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [campaigns, setCampaigns] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [adminAddress, setAdminAddress] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [donating, setDonating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showProofSubmission, setShowProofSubmission] = useState(false);
  const [selectedCampaignForProof, setSelectedCampaignForProof] = useState(null);
  const [showRecentCampaigns, setShowRecentCampaigns] = useState(true);

  useEffect(() => {
    if (contractError) {
      setError(contractError);
      setLoading(false);
      return;
    }
    fetchData();
  }, [contract, contractError]);

  const getNGONameFromWallet = async (walletAddress) => {
    try {
      const ngoProfilesRef = collection(db, "ngoProfiles");
      const q = query(ngoProfilesRef, where("walletAddress", "==", walletAddress));
      const ngoSnapshot = await getDocs(q);
      
      if (!ngoSnapshot.empty) {
        return ngoSnapshot.docs[0].data().name || "Unknown NGO";
      }
      return "Unknown NGO";
    } catch (error) {
      console.error("Error fetching NGO name:", error);
      return "Unknown NGO";
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!contract) {
        console.error('Contract not initialized');
        throw new Error('Contract not initialized');
      }

      const count = await contract.campaignCount();
      const totalCampaigns = Number(count);
      setTotalCampaigns(totalCampaigns);

      if (totalCampaigns === 0) {
        console.log('No campaigns found');
        setCampaigns([]);
        setRecentCampaigns([]);
        setLoading(false);
        return;
      }

      // Fetch recent campaigns
      const recentCampaignsData = [];
      const recentCount = Math.min(RECENT_CAMPAIGNS_COUNT, totalCampaigns);
      for (let i = totalCampaigns - 1; i >= Math.max(0, totalCampaigns - recentCount); i--) {
        try {
          const campaign = await contract.campaigns(i);
          const goal = ethers.formatEther(campaign.goal || '0');
          const raised = ethers.formatEther(campaign.balance || '0');
          const ngoName = await getNGONameFromWallet(campaign.owner);
          
          recentCampaignsData.unshift({
            id: i,
            name: campaign.name,
            description: campaign.description,
            goal: goal,
            raised: raised,
            deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
            completed: campaign.completed,
            state: ["Active", "Successful", "Failed"][Number(campaign.state)],
            timestamp: Number(campaign.createdAt || campaign.deadline) * 1000,
            rawGoal: campaign.goal,
            rawBalance: campaign.balance,
            owner: campaign.owner,
            ngoName: ngoName
          });
        } catch (campaignErr) {
          console.error(`Error fetching recent campaign ${i}:`, campaignErr);
        }
      }
      setRecentCampaigns(recentCampaignsData);

      // Fetch campaigns for current page
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCampaigns);
      
      const campaignsData = [];
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const campaign = await contract.campaigns(i);
          const goal = ethers.formatEther(campaign.goal || '0');
          const raised = ethers.formatEther(campaign.balance || '0');
          const ngoName = await getNGONameFromWallet(campaign.owner);
          
          campaignsData.push({
            id: i,
            name: campaign.name,
            description: campaign.description,
            goal: goal,
            raised: raised,
            deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
            completed: campaign.completed,
            state: ["Active", "Successful", "Failed"][Number(campaign.state)],
            timestamp: Number(campaign.createdAt || campaign.deadline) * 1000,
            rawGoal: campaign.goal,
            rawBalance: campaign.balance,
            owner: campaign.owner,
            ngoName: ngoName
          });
        } catch (campaignErr) {
          console.error(`Error fetching campaign ${i}:`, campaignErr);
          continue;
        }
      }

      campaignsData.sort((a, b) => b.timestamp - a.timestamp);
      setCampaigns(campaignsData);

      const admin = await contract.admin();
      setAdminAddress(admin);

      const paused = await contract.paused();
      setIsPaused(paused);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setNotification({
        message: `Failed to fetch campaign data: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, contract]);

  const handleCampaignSelect = async (campaignId) => {
    try {
      setLoading(true);
      setError(null);

      // Check both recent and regular campaigns
      const campaign = [...recentCampaigns, ...campaigns].find(c => c.id === campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const [contributorAddresses, amounts] = await contract.getContributors(campaignId);
      const contributorsData = contributorAddresses.map((address, index) => ({
        address,
        amount: ethers.formatEther(amounts[index])
      }));

      setContributors(contributorsData);
      setSelectedCampaign(campaign);
    } catch (err) {
      console.error('Error fetching contributors:', err);
      setError(err.message);
      setNotification({
        message: 'Failed to fetch contributor data. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDonation = async (e) => {
    e.preventDefault();
    setDonating(true);
    try {
      setError(null);

      if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
        throw new Error('Please enter a valid donation amount');
      }

      if (!contract) {
        throw new Error('Contract not initialized. Please try again later.');
      }

      const campaign = [...recentCampaigns, ...campaigns].find(c => c.id === selectedCampaign.id);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const donationInWei = ethers.parseEther(donationAmount);
      const remainingInWei = campaign.rawGoal - campaign.rawBalance;

      if (donationInWei > remainingInWei) {
        throw new Error('Donation amount exceeds remaining campaign goal');
      }

      const tx = await contract.contribute(selectedCampaign.id, { value: donationInWei });
      await tx.wait();
      
      await fetchData();

      setDonationAmount('');
      setNotification({
        message: 'Donation successful! Thank you for your contribution.',
        type: 'success'
      });

      setSelectedCampaign(null);
    } catch (err) {
      console.error('Error making donation:', err);
      setError(err.message);
      setNotification({
        message: `Failed to make donation: ${err.message}`,
        type: 'error'
      });
    } finally {
      setDonating(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (e) => {
    setSortBy(e.target.value);
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    let result = [...campaigns];
    
    if (searchTerm) {
      result = result.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        result.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'goal-high':
        result.sort((a, b) => Number(b.goal) - Number(a.goal));
        break;
      case 'goal-low':
        result.sort((a, b) => Number(a.goal) - Number(b.goal));
        break;
      default:
        break;
    }
    
    return result;
  }, [campaigns, searchTerm, sortBy]);

  const totalPages = Math.ceil(totalCampaigns / ITEMS_PER_PAGE);

  const handleWithdraw = async (campaignId) => {
    if (!contract) {
      setError('Contract not initialized');
      return;
    }

    setWithdrawing(true);
    try {
      setError(null);

      const gasEstimate = await contract.withdrawFunds.estimateGas(campaignId);
      const gasLimit = gasEstimate.mul(120).div(100);
      
      const tx = await contract.withdrawFunds(campaignId, { gasLimit });
      await tx.wait();

      await fetchData();
      setNotification({
        message: 'Funds withdrawn successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setError(err.message || 'Failed to withdraw funds');
      setNotification({
        message: err.message || 'Failed to withdraw funds. Please try again.',
        type: 'error'
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleProofSubmission = (campaignId) => {
    const campaign = [...recentCampaigns, ...campaigns].find(c => c.id === campaignId);
    setSelectedCampaignForProof(campaign);
    setShowProofSubmission(true);
  };

  if (loading && !campaigns.length) {
    return <LoadingSpinner fullPage />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="ganache-data">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ToastNotification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {recentCampaigns.length > 0 && (
        <div className="recent-campaigns-section">
          <div className="section-header">
            <h2>🔥 Recently Launched Campaigns</h2>
            <button 
              onClick={() => setShowRecentCampaigns(!showRecentCampaigns)}
              className="toggle-button"
            >
              {showRecentCampaigns ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showRecentCampaigns && (
            <div className="recent-campaigns-grid">
              <AnimatePresence>
                {recentCampaigns.map((campaign) => (
                  <motion.div
                    key={`recent-${campaign.id}`}
                    className={`campaign-card recent-campaign ${campaign.state.toLowerCase()}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="new-badge">NEW</div>
                    <div className="card-header">
                      <div className="card-title">
                        <h3>{campaign.name}</h3>
                        <div className="ngo-info">
                          <span className="wallet-address">{campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}</span>
                          <span className="ngo-name">by {campaign.ngoName}</span>
                        </div>
                      </div>
                      <div className="card-header-actions">
                        <span className={`status-badge ${campaign.state.toLowerCase()}`}>
                          {campaign.state}
                        </span>
                      </div>
                    </div>
                    <p className="campaign-description">{campaign.description}</p>
                    <div className="campaign-stats">
                      <div className="stat-item">
                        <span className="stat-label">Goal:</span>
                        <span className="stat-value">
                          {selectedCurrency.symbol}{convertAmount(campaign.goal, 'ETH')}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Raised:</span>
                        <span className="stat-value">
                          {selectedCurrency.symbol}{convertAmount(campaign.raised, 'ETH')}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Progress:</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <span className="deadline">Deadline: {campaign.deadline}</span>
                      <button
                        className="donate-button"
                        onClick={() => handleCampaignSelect(campaign.id)}
                        disabled={isPaused || campaign.state !== "Active"}
                      >
                        Donate Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <div className="contract-info">
        <h2>All Campaigns</h2>
        {isPaused && (
          <div className="paused-warning">
            ⚠️ Campaigns are currently paused
          </div>
        )}
      </div>

      <div className="campaigns-controls">
        <div className="search-sort">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <select value={sortBy} onChange={handleSort} className="sort-select">
            <option value="newest">Recently Created</option>
            <option value="oldest">Oldest First</option>
            <option value="goal-high">Highest Goal</option>
            <option value="goal-low">Lowest Goal</option>
          </select>
        </div>
      </div>

      <div className="campaigns-grid">
        <AnimatePresence>
          {filteredAndSortedCampaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              className={`campaign-card ${campaign.state.toLowerCase()}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card-header">
                <div className="card-title">
                  <h3>{campaign.name}</h3>
                  <div className="ngo-info">
                    <span className="wallet-address">{campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}</span>
                    <span className="ngo-name">by {campaign.ngoName}</span>
                  </div>
                </div>
                <div className="card-header-actions">
                  <span className={`status-badge ${campaign.state.toLowerCase()}`}>
                    {campaign.state}
                  </span>
                </div>
              </div>
              <p className="campaign-description">{campaign.description}</p>
              <div className="campaign-stats">
                <div className="stat-item">
                  <span className="stat-label">Goal:</span>
                  <span className="stat-value">
                    {selectedCurrency.symbol}{convertAmount(campaign.goal, 'ETH')}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Raised:</span>
                  <span className="stat-value">
                    {selectedCurrency.symbol}{convertAmount(campaign.raised, 'ETH')}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Progress:</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <span className="deadline">Deadline: {campaign.deadline}</span>
                <button
                  className="donate-button"
                  onClick={() => handleCampaignSelect(campaign.id)}
                  disabled={isPaused || campaign.state !== "Active"}
                >
                  Donate Now
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-button"
          >
            Next
          </button>
        </div>
      )}

      {selectedCampaign && (
        <motion.div
          className="campaign-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="modal-content">
            <h3>{selectedCampaign.name}</h3>
            <p>{selectedCampaign.description}</p>
            
            <div className="details-grid">
              <div className="detail-item">
                <span>Goal</span>
                <strong>{selectedCurrency.symbol}{convertAmount(selectedCampaign.goal, 'ETH')}</strong>
              </div>
              <div className="detail-item">
                <span>Raised</span>
                <strong>{selectedCurrency.symbol}{convertAmount(selectedCampaign.raised, 'ETH')}</strong>
              </div>
              <div className="detail-item">
                <span>Deadline</span>
                <strong>{selectedCampaign.deadline}</strong>
              </div>
              <div className="detail-item">
                <span>Status</span>
                <strong>{selectedCampaign.state || "Active"}</strong>
              </div>
            </div>

            <div className="contributors-section">
              <h4>Contributors</h4>
              {loading ? (
                <LoadingSpinner />
              ) : contributors.length > 0 ? (
                <ul className="contributors-list">
                  {contributors.map((contributor, index) => (
                    <motion.li
                      key={index}
                      className="contributor-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="contributor-address">
                        {contributor.address.slice(0, 6)}...{contributor.address.slice(-4)}
                      </span>
                      <span className="contributor-amount">{contributor.amount} ETH</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="no-contributors">No contributors yet</p>
              )}
            </div>

            <form onSubmit={handleDonation} className="donation-form">
              <div className="donation-input-group">
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount in ETH"
                  min="0"
                  step="0.01"
                  disabled={donating}
                  required
                />
                <motion.button
                  type="submit"
                  disabled={donating || !donationAmount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {donating ? (
                    <span className="button-loader"></span>
                  ) : (
                    'Donate'
                  )}
                </motion.button>
              </div>
            </form>

            <div className="modal-actions">
              <button onClick={() => setSelectedCampaign(null)}>Close</button>
            </div>
          </div>
        </motion.div>
      )}

      {showProofSubmission && selectedCampaignForProof && (
        <div className="modal-overlay" onClick={() => setShowProofSubmission(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ProofSubmissionForm
              campaignId={selectedCampaignForProof.id}
              onClose={() => setShowProofSubmission(false)}
              currentAccount={currentAccount}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GanacheData;


// import React, { useState, useEffect, useMemo } from 'react';
// import { useContract } from '../context/ContractContext';
// import { useCurrency } from '../context/CurrencyContext';
// import { ethers } from 'ethers';
// import { motion, AnimatePresence } from 'framer-motion';
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { db } from "../firebaseConfig";
// import ToastNotification from './ToastNotification';
// import LoadingSpinner from './LoadingSpinner';
// import ProofSubmissionForm from './ProofSubmissionForm';
// import '../styles/GanacheData.css';

// const ITEMS_PER_PAGE = 5;
// const NEW_CAMPAIGNS_COUNT = 3;

// const GanacheData = ({ currentAccount }) => {
//   // All hooks declared at the top
//   const { contract, provider, error: contractError } = useContract();
//   const { selectedCurrency, convertAmount } = useCurrency();
  
//   const [state, setState] = useState({
//     campaigns: [],
//     selectedCampaign: null,
//     contributors: [],
//     adminAddress: '',
//     isPaused: false,
//     loading: true,
//     error: null,
//     donationAmount: '',
//     currentPage: 1,
//     totalCampaigns: 0,
//     searchTerm: '',
//     sortBy: 'newest',
//     donating: false,
//     notification: null,
//     withdrawing: false,
//     showProofSubmission: false,
//     selectedCampaignForProof: null
//   });

//   const [newCampaigns, setNewCampaigns] = useState([]);
//   const [showNewCampaigns, setShowNewCampaigns] = useState(true);

//   // useMemo declared at top level before any conditional returns
//   const filteredAndSortedCampaigns = useMemo(() => {
//     let result = [...state.campaigns];
    
//     if (state.searchTerm) {
//       const term = state.searchTerm.toLowerCase();
//       result = result.filter(campaign => 
//         campaign.name.toLowerCase().includes(term) ||
//         campaign.description.toLowerCase().includes(term)
//       );
//     }
    
//     switch (state.sortBy) {
//       case 'newest':
//         result.sort((a, b) => b.timestamp - a.timestamp);
//         break;
//       case 'oldest':
//         result.sort((a, b) => a.timestamp - b.timestamp);
//         break;
//       case 'goal-high':
//         result.sort((a, b) => Number(b.goal) - Number(a.goal));
//         break;
//       case 'goal-low':
//         result.sort((a, b) => Number(a.goal) - Number(b.goal));
//         break;
//       default:
//         break;
//     }
    
//     return result;
//   }, [state.campaigns, state.searchTerm, state.sortBy]);

//   const totalPages = Math.ceil(state.totalCampaigns / ITEMS_PER_PAGE);

//   const getNGONameFromWallet = async (walletAddress) => {
//     try {
//       const ngoProfilesRef = collection(db, "ngoProfiles");
//       const q = query(ngoProfilesRef, where("walletAddress", "==", walletAddress));
//       const ngoSnapshot = await getDocs(q);
//       return ngoSnapshot.empty ? "Unknown NGO" : ngoSnapshot.docs[0].data().name || "Unknown NGO";
//     } catch (error) {
//       console.error("Error fetching NGO name:", error);
//       return "Unknown NGO";
//     }
//   };

//   const fetchData = async () => {
//     if (contractError) {
//       setState(prev => ({ ...prev, error: contractError, loading: false }));
//       return;
//     }

//     try {
//       setState(prev => ({ ...prev, loading: true, error: null }));

//       if (!contract) {
//         throw new Error('Contract not initialized');
//       }

//       const count = await contract.campaignCount();
//       const totalCampaigns = Number(count);
      
//       // Fetch newest campaigns
//       const newestCampaigns = [];
//       const newCount = Math.min(NEW_CAMPAIGNS_COUNT, totalCampaigns);
//       for (let i = totalCampaigns - 1; i >= Math.max(0, totalCampaigns - newCount); i--) {
//         const campaign = await contract.campaigns(i);
//         const ngoName = await getNGONameFromWallet(campaign.owner);
        
//         newestCampaigns.unshift({
//           id: i,
//           name: campaign.name,
//           description: campaign.description,
//           goal: ethers.formatEther(campaign.goal || '0'),
//           raised: ethers.formatEther(campaign.balance || '0'),
//           deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
//           completed: campaign.completed,
//           state: ["Active", "Successful", "Failed"][Number(campaign.state)],
//           timestamp: Number(campaign.createdAt || campaign.deadline) * 1000,
//           rawGoal: campaign.goal,
//           rawBalance: campaign.balance,
//           owner: campaign.owner,
//           ngoName
//         });
//       }
//       setNewCampaigns(newestCampaigns);

//       if (totalCampaigns === 0) {
//         setState(prev => ({ ...prev, campaigns: [], loading: false, totalCampaigns }));
//         return;
//       }

//       const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
//       const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCampaigns);
      
//       const campaignsData = [];
//       for (let i = startIndex; i < endIndex; i++) {
//         try {
//           const campaign = await contract.campaigns(i);
//           const ngoName = await getNGONameFromWallet(campaign.owner);
          
//           campaignsData.push({
//             id: i,
//             name: campaign.name,
//             description: campaign.description,
//             goal: ethers.formatEther(campaign.goal || '0'),
//             raised: ethers.formatEther(campaign.balance || '0'),
//             deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
//             completed: campaign.completed,
//             state: ["Active", "Successful", "Failed"][Number(campaign.state)],
//             timestamp: Number(campaign.createdAt || campaign.deadline) * 1000,
//             rawGoal: campaign.goal,
//             rawBalance: campaign.balance,
//             owner: campaign.owner,
//             ngoName
//           });
//         } catch (campaignErr) {
//           console.error(`Error fetching campaign ${i}:`, campaignErr);
//         }
//       }

//       campaignsData.sort((a, b) => b.timestamp - a.timestamp);
      
//       const admin = await contract.admin();
//       const paused = await contract.paused();

//       setState(prev => ({
//         ...prev,
//         campaigns: campaignsData,
//         adminAddress: admin,
//         isPaused: paused,
//         totalCampaigns,
//         loading: false
//       }));

//     } catch (err) {
//       console.error('Error fetching data:', err);
//       setState(prev => ({
//         ...prev,
//         error: err.message,
//         notification: {
//           message: `Failed to fetch campaign data: ${err.message}`,
//           type: 'error'
//         },
//         loading: false
//       }));
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [contract, state.currentPage, contractError]);

//   const handleCampaignSelect = async (campaignId) => {
//     try {
//       setState(prev => ({ ...prev, loading: true, error: null }));

//       const [contributorAddresses, amounts] = await contract.getContributors(campaignId);
//       const contributorsData = contributorAddresses.map((address, index) => ({
//         address,
//         amount: ethers.formatEther(amounts[index])
//       }));

//       setState(prev => ({
//         ...prev,
//         contributors: contributorsData,
//         selectedCampaign: prev.campaigns.find(c => c.id === campaignId),
//         loading: false
//       }));
//     } catch (err) {
//       console.error('Error fetching contributors:', err);
//       setState(prev => ({
//         ...prev,
//         error: err.message,
//         notification: {
//           message: 'Failed to fetch contributor data. Please try again.',
//           type: 'error'
//         },
//         loading: false
//       }));
//     }
//   };

//   const handleDonation = async (e) => {
//     e.preventDefault();
//     setState(prev => ({ ...prev, donating: true, error: null }));

//     try {
//       if (!state.donationAmount || isNaN(state.donationAmount) || parseFloat(state.donationAmount) <= 0) {
//         throw new Error('Please enter a valid donation amount');
//       }

//       if (!contract) {
//         throw new Error('Contract not initialized. Please try again later.');
//       }

//       const campaign = state.campaigns.find(c => c.id === state.selectedCampaign.id);
//       if (!campaign) {
//         throw new Error('Campaign not found');
//       }

//       const donationInWei = ethers.parseEther(state.donationAmount);
//       const remainingInWei = campaign.rawGoal - campaign.rawBalance;

//       if (donationInWei > remainingInWei) {
//         throw new Error('Donation amount exceeds remaining campaign goal');
//       }

//       const tx = await contract.contribute(state.selectedCampaign.id, { value: donationInWei });
//       await tx.wait();
      
//       await fetchData();

//       setState(prev => ({
//         ...prev,
//         donationAmount: '',
//         notification: {
//           message: 'Donation successful! Thank you for your contribution.',
//           type: 'success'
//         },
//         selectedCampaign: null,
//         donating: false
//       }));

//     } catch (err) {
//       console.error('Error making donation:', err);
//       setState(prev => ({
//         ...prev,
//         error: err.message,
//         notification: {
//           message: `Failed to make donation: ${err.message}`,
//           type: 'error'
//         },
//         donating: false
//       }));
//     }
//   };

//   const handlePageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= totalPages) {
//       setState(prev => ({ ...prev, currentPage: newPage }));
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const handleSearch = (e) => {
//     setState(prev => ({ ...prev, searchTerm: e.target.value, currentPage: 1 }));
//   };

//   const handleSort = (e) => {
//     setState(prev => ({ ...prev, sortBy: e.target.value }));
//   };

//   const handleWithdraw = async (campaignId) => {
//     if (!contract) {
//       setState(prev => ({ ...prev, error: 'Contract not initialized' }));
//       return;
//     }

//     setState(prev => ({ ...prev, withdrawing: true, error: null }));

//     try {
//       const gasEstimate = await contract.withdrawFunds.estimateGas(campaignId);
//       const gasLimit = gasEstimate.mul(120).div(100);
      
//       const tx = await contract.withdrawFunds(campaignId, { gasLimit });
//       await tx.wait();

//       await fetchData();
//       setState(prev => ({
//         ...prev,
//         notification: {
//           message: 'Funds withdrawn successfully!',
//           type: 'success'
//         },
//         withdrawing: false
//       }));
//     } catch (err) {
//       console.error('Error withdrawing funds:', err);
//       setState(prev => ({
//         ...prev,
//         error: err.message || 'Failed to withdraw funds',
//         notification: {
//           message: err.message || 'Failed to withdraw funds. Please try again.',
//           type: 'error'
//         },
//         withdrawing: false
//       }));
//     }
//   };

//   const handleProofSubmission = (campaignId) => {
//     const campaign = state.campaigns.find(c => c.id === campaignId);
//     setState(prev => ({
//       ...prev,
//       selectedCampaignForProof: campaign,
//       showProofSubmission: true
//     }));
//   };

//   const renderNewCampaignsSection = () => (
//     <div className="new-campaigns-section">
//       <div className="section-header">
//         <h2>🔥 Newly Created Campaigns</h2>
//         <button 
//           onClick={() => setShowNewCampaigns(!showNewCampaigns)}
//           className="toggle-button"
//         >
//           {showNewCampaigns ? 'Hide' : 'Show New Campaigns'}
//         </button>
//       </div>
      
//       {showNewCampaigns && (
//         <div className="new-campaigns-grid">
//           <AnimatePresence>
//             {newCampaigns.map((campaign) => (
//               <motion.div
//                 key={`new-${campaign.id}`}
//                 className={`campaign-card new-campaign ${campaign.state.toLowerCase()}`}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.3 }}
//                 whileHover={{ scale: 1.02 }}
//               >
//                 <div className="card-badge">NEW</div>
//                 <div className="card-header">
//                   <div className="card-title">
//                     <h3>{campaign.name}</h3>
//                     <div className="ngo-info">
//                       <span className="wallet-address">{campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}</span>
//                       <span className="ngo-name">by {campaign.ngoName}</span>
//                     </div>
//                   </div>
//                   <div className="card-header-actions">
//                     <span className={`status-badge ${campaign.state.toLowerCase()}`}>
//                       {campaign.state}
//                     </span>
//                   </div>
//                 </div>
//                 <p className="campaign-description">{campaign.description}</p>
//                 <div className="campaign-stats">
//                   <div className="stat-item">
//                     <span className="stat-label">Goal:</span>
//                     <span className="stat-value">
//                       {selectedCurrency.symbol}{convertAmount(campaign.goal, 'ETH')}
//                     </span>
//                   </div>
//                   <div className="stat-item">
//                     <span className="stat-label">Raised:</span>
//                     <span className="stat-value">
//                       {selectedCurrency.symbol}{convertAmount(campaign.raised, 'ETH')}
//                     </span>
//                   </div>
//                   <div className="stat-item">
//                     <span className="stat-label">Progress:</span>
//                     <div className="progress-bar">
//                       <div 
//                         className="progress-fill"
//                         style={{ 
//                           width: `${Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100)}%`
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 <div className="card-footer">
//                   <span className="deadline">Deadline: {campaign.deadline}</span>
//                   <button
//                     className="donate-button"
//                     onClick={() => handleCampaignSelect(campaign.id)}
//                     disabled={state.isPaused || campaign.state !== "Active"}
//                   >
//                     Donate Now
//                   </button>
//                 </div>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </div>
//       )}
//     </div>
//   );

//   if (state.loading && !state.campaigns.length) {
//     return <LoadingSpinner fullPage />;
//   }

//   if (state.error) {
//     return (
//       <div className="error-container">
//         <div className="error-icon">⚠️</div>
//         <h3>Error</h3>
//         <p>{state.error}</p>
//         <button onClick={fetchData} className="retry-button">
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="ganache-data">
//       <AnimatePresence>
//         {state.notification && (
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//           >
//             <ToastNotification
//               message={state.notification.message}
//               type={state.notification.type}
//               onClose={() => setState(prev => ({ ...prev, notification: null }))}
//             />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {newCampaigns.length > 0 && renderNewCampaignsSection()}

//       <div className="contract-info">
//         <h2>All Campaigns</h2>
//         {state.isPaused && (
//           <div className="paused-warning">
//             ⚠️ Campaigns are currently paused
//           </div>
//         )}
//       </div>

//       <div className="campaigns-controls">
//         <div className="search-sort">
//           <input
//             type="text"
//             placeholder="Search campaigns..."
//             value={state.searchTerm}
//             onChange={handleSearch}
//             className="search-input"
//           />
//           <select 
//             value={state.sortBy} 
//             onChange={handleSort}
//             className="sort-select"
//           >
//             <option value="newest">Recently Created</option>
//             <option value="oldest">Oldest First</option>
//             <option value="goal-high">Highest Goal</option>
//             <option value="goal-low">Lowest Goal</option>
//           </select>
//         </div>
//       </div>

//       <div className="campaigns-grid">
//         <AnimatePresence>
//           {filteredAndSortedCampaigns.map((campaign) => (
//             <motion.div
//               key={campaign.id}
//               className={`campaign-card ${campaign.state.toLowerCase()}`}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3 }}
//             >
//               <div className="card-header">
//                 <div className="card-title">
//                   <h3>{campaign.name}</h3>
//                   <div className="ngo-info">
//                     <span className="wallet-address">{campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}</span>
//                     <span className="ngo-name">by {campaign.ngoName}</span>
//                   </div>
//                 </div>
//                 <div className="card-header-actions">
//                   <span className={`status-badge ${campaign.state.toLowerCase()}`}>
//                     {campaign.state}
//                   </span>
//                 </div>
//               </div>
//               <p className="campaign-description">{campaign.description}</p>
//               <div className="campaign-stats">
//                 <div className="stat-item">
//                   <span className="stat-label">Goal:</span>
//                   <span className="stat-value">
//                     {selectedCurrency.symbol}{convertAmount(campaign.goal, 'ETH')}
//                   </span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Raised:</span>
//                   <span className="stat-value">
//                     {selectedCurrency.symbol}{convertAmount(campaign.raised, 'ETH')}
//                   </span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Progress:</span>
//                   <div className="progress-bar">
//                     <div 
//                       className="progress-fill"
//                       style={{ 
//                         width: `${Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100)}%`
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>
//               <div className="card-footer">
//                 <span className="deadline">Deadline: {campaign.deadline}</span>
//                 <div className="card-actions">
//                   <button
//                     className="donate-button"
//                     onClick={() => handleCampaignSelect(campaign.id)}
//                     disabled={state.isPaused || campaign.state !== "Active"}
//                   >
//                     Donate Now
//                   </button>
//                   {currentAccount === campaign.owner && (
//                     <button
//                       className="proof-button"
//                       onClick={() => handleProofSubmission(campaign.id)}
//                     >
//                       Submit Proof
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </div>

//       {totalPages > 1 && (
//         <div className="pagination">
//           <button
//             onClick={() => handlePageChange(state.currentPage - 1)}
//             disabled={state.currentPage === 1}
//             className="page-button"
//           >
//             Previous
//           </button>
//           <div className="page-numbers">
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
//               <button
//                 key={pageNum}
//                 onClick={() => handlePageChange(pageNum)}
//                 className={`page-number ${state.currentPage === pageNum ? 'active' : ''}`}
//               >
//                 {pageNum}
//               </button>
//             ))}
//           </div>
//           <button
//             onClick={() => handlePageChange(state.currentPage + 1)}
//             disabled={state.currentPage === totalPages}
//             className="page-button"
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {state.selectedCampaign && (
//         <motion.div
//           className="campaign-modal"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//         >
//           <div className="modal-content">
//             <h3>{state.selectedCampaign.name}</h3>
//             <p>{state.selectedCampaign.description}</p>
            
//             <div className="details-grid">
//               <div className="detail-item">
//                 <span>Goal</span>
//                 <strong>{selectedCurrency.symbol}{convertAmount(state.selectedCampaign.goal, 'ETH')}</strong>
//               </div>
//               <div className="detail-item">
//                 <span>Raised</span>
//                 <strong>{selectedCurrency.symbol}{convertAmount(state.selectedCampaign.raised, 'ETH')}</strong>
//               </div>
//               <div className="detail-item">
//                 <span>Deadline</span>
//                 <strong>{state.selectedCampaign.deadline}</strong>
//               </div>
//               <div className="detail-item">
//                 <span>Status</span>
//                 <strong>{state.selectedCampaign.state || "Active"}</strong>
//               </div>
//             </div>

//             <div className="contributors-section">
//               <h4>Contributors</h4>
//               {state.loading ? (
//                 <LoadingSpinner />
//               ) : state.contributors.length > 0 ? (
//                 <ul className="contributors-list">
//                   {state.contributors.map((contributor, index) => (
//                     <motion.li
//                       key={index}
//                       className="contributor-item"
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: index * 0.1 }}
//                     >
//                       <span className="contributor-address">
//                         {contributor.address.slice(0, 6)}...{contributor.address.slice(-4)}
//                       </span>
//                       <span className="contributor-amount">{contributor.amount} ETH</span>
//                     </motion.li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="no-contributors">No contributors yet</p>
//               )}
//             </div>

//             <form onSubmit={handleDonation} className="donation-form">
//               <div className="donation-input-group">
//                 <input
//                   type="number"
//                   value={state.donationAmount}
//                   onChange={(e) => setState(prev => ({ ...prev, donationAmount: e.target.value }))}
//                   placeholder="Enter amount in ETH"
//                   min="0"
//                   step="0.01"
//                   disabled={state.donating}
//                   required
//                 />
//                 <motion.button
//                   type="submit"
//                   disabled={state.donating || !state.donationAmount}
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                 >
//                   {state.donating ? (
//                     <span className="button-loader"></span>
//                   ) : (
//                     'Donate'
//                   )}
//                 </motion.button>
//               </div>
//             </form>

//             <div className="modal-actions">
//               <button onClick={() => setState(prev => ({ ...prev, selectedCampaign: null }))}>Close</button>
//             </div>
//           </div>
//         </motion.div>
//       )}

//       {state.showProofSubmission && state.selectedCampaignForProof && (
//         <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showProofSubmission: false }))}>
//           <div className="modal-content" onClick={e => e.stopPropagation()}>
//             <ProofSubmissionForm
//               campaignId={state.selectedCampaignForProof.id}
//               onClose={() => setState(prev => ({ ...prev, showProofSubmission: false }))}
//               currentAccount={currentAccount}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default GanacheData;