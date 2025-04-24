// import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { useContract } from "../context/ContractContext";
// import { useAuth } from "../context/AuthContext";
// import { useCurrency } from "../context/CurrencyContext";
// import { ethers } from "ethers";
// import NGOProfile from "./NGOProfile";
// import "../styles/NGODashboard.css";
// import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
// import { db } from '../firebaseConfig'; // Make sure this import exists
// import { saveProof, getProof, updateProofVerification, displayProofFile } from "../utils/proofUtils";

// // Error Boundary Component
// class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true };
//   }

//   componentDidCatch(error, errorInfo) {
//     console.error('Error caught by boundary:', error, errorInfo);
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="error-container">
//           <h2>Something went wrong.</h2>
//           <button onClick={() => window.location.reload()}>Refresh Page</button>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// function NGODashboard() {
//   const navigate = useNavigate();
//   const { contract, currentAccount, isInitializing } = useContract();
//   const { currentUser } = useAuth();
//   const { selectedCurrency, convertAmount } = useCurrency();
//   const [myCampaigns, setMyCampaigns] = useState([]);
//   const [newCampaign, setNewCampaign] = useState({ name: "", description: "", goal: "", duration: "" });
//   const [loading, setLoading] = useState(true);
//   const [viewProfile, setViewProfile] = useState(false);
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const [error, setError] = useState(null);
//   const [notification, setNotification] = useState(null);
//   const [withdrawingCampaignId, setWithdrawingCampaignId] = useState(null);

//   // Add new state for proof handling
//   const [proofFile, setProofFile] = useState(null);
//   const [proofDescription, setProofDescription] = useState("");
//   const [submittingProof, setSubmittingProof] = useState(false);

//   // Add new state for filters
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [sortBy, setSortBy] = useState("newest");
//   const [currentPage, setCurrentPage] = useState(1);
//   const ITEMS_PER_PAGE = 6;

//   const fileInputRef = useRef({});

//   // Safe state update function
//   const safeSetState = (setter) => {
//     if (mounted.current) {
//       setter();
//     }
//   };

//   const mounted = useRef(false);

//   useEffect(() => {
//     mounted.current = true;
//     return () => {
//       mounted.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (!currentUser && !loading) {
//       console.log("No user found, redirecting to auth...");
//       navigate("/auth");
//       return;
//     }

//     if (currentUser && currentAccount && !isInitializing) {
//       console.log("User is logged in:", currentUser.email);
//       fetchMyCampaigns();
//     }
//   }, [currentUser, currentAccount, isInitializing, navigate]);

//   // Initialize contract and set up event listeners
//   useEffect(() => {
//     if (!contract || !currentAccount || isInitializing) return;

//     const cleanup = () => {
//       if (contract) {
//         contract.removeAllListeners("FundsWithdrawn");
//         contract.removeAllListeners("CampaignCreated");
//         contract.removeAllListeners("ContributionReceived");
//       }
//     };

//     try {
//       const onFundsWithdrawn = (campaignId, amount) => {
//         console.log(`Funds withdrawn from campaign ${campaignId}: ${ethers.formatEther(amount)} ETH`);
//         if (mounted.current) {
//           fetchMyCampaigns();
//         }
//       };

//       const onCampaignCreated = (campaignId, owner, name, goal, deadline) => {
//         console.log(`New campaign created: ${name}`);
//         if (owner.toLowerCase() === currentAccount.toLowerCase() && mounted.current) {
//           fetchMyCampaigns();
//         }
//       };

//       const onContributionReceived = (campaignId, contributor, amount) => {
//         console.log(`Contribution received for campaign ${campaignId}: ${ethers.formatEther(amount)} ETH`);
//         if (mounted.current) {
//           fetchMyCampaigns();
//         }
//       };

//       contract.on("FundsWithdrawn", onFundsWithdrawn);
//       contract.on("CampaignCreated", onCampaignCreated);
//       contract.on("ContributionReceived", onContributionReceived);

//       return cleanup;
//     } catch (error) {
//       console.error("Error setting up event listeners:", error);
//       return cleanup;
//     }
//   }, [contract, currentAccount, isInitializing]);

//   // Inside the component, add state for storing stats
//   const [ngoStats, setNgoStats] = useState({
//     totalCampaigns: 0,
//     totalRaised: 0
//   });

//   // Add new state for real-time updates
//   const unsubscribeRef = useRef(null);

//   // Add new state for NGO profile data
//   const [ngoProfileData, setNgoProfileData] = useState(null);

//   // Add function to fetch NGO Profile data
//   const fetchNGOProfileData = async () => {
//     if (!currentUser) return null;
    
//     try {
//       const ngoProfilesRef = collection(db, 'ngoProfiles');
//       const q = query(ngoProfilesRef, where('email', '==', currentUser.email));
//       const querySnapshot = await getDocs(q);
      
//       if (!querySnapshot.empty) {
//         const profileData = querySnapshot.docs[0].data();
//         setNgoProfileData(profileData);
//         return profileData;
//       }
//       return null;
//     } catch (error) {
//       console.error("Error fetching NGO profile data:", error);
//       return null;
//     }
//   };

//   // Update useEffect to fetch profile data
//   useEffect(() => {
//     if (currentUser) {
//       fetchNGOProfileData();
//     }
//   }, [currentUser]);

//   // Update the real-time listener setup
//   useEffect(() => {
//     if (!currentUser) return;

//     // Setup listener for users collection
//     const userRef = doc(db, 'users', currentUser.email);
//     const unsubscribeUser = onSnapshot(userRef, (doc) => {
//       if (doc.exists()) {
//         const userData = doc.data();
//         setNgoStats({
//           totalCampaigns: userData.campaignsCount || 0,
//           totalRaised: userData.totalRaised || 0,
//           name: userData.name,
//           walletAddress: userData.walletAddress
//         });
//       }
//     });

//     // Setup listener for ngoProfiles collection
//     const ngoProfilesRef = collection(db, 'ngoProfiles');
//     const q = query(ngoProfilesRef, where('email', '==', currentUser.email));
//     const unsubscribeProfile = onSnapshot(q, (snapshot) => {
//       if (!snapshot.empty) {
//         const profileData = snapshot.docs[0].data();
//         setNgoProfileData(profileData);
//         setNgoStats(prev => ({
//           ...prev,
//           totalCampaigns: profileData.campaignsCount || 0,
//           totalRaised: profileData.totalRaised || 0,
//           name: profileData.name,
//           walletAddress: profileData.walletAddress
//         }));
//       }
//     });

//     // Store unsubscribe functions
//     unsubscribeRef.current = () => {
//       unsubscribeUser();
//       unsubscribeProfile();
//     };

//     return () => {
//       if (unsubscribeRef.current) {
//         unsubscribeRef.current();
//       }
//     };
//   }, [currentUser]);

//   const handleInputChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setNewCampaign(prev => ({ ...prev, [name]: value }));
//   }, []);

//   const createCampaign = async (e) => {
//     e.preventDefault();
//     if (!contract) {
//       setError("Contract not initialized");
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       // Validate input
//       if (!newCampaign.name || !newCampaign.description || !newCampaign.goal || !newCampaign.duration) {
//         throw new Error("Please fill in all fields");
//       }

//       if (parseFloat(newCampaign.goal) <= 0) {
//         throw new Error("Goal amount must be greater than 0");
//       }

//       if (parseInt(newCampaign.duration) <= 0) {
//         throw new Error("Duration must be greater than 0");
//       }

//       const txn = await contract.createCampaign(
//         newCampaign.name,
//         newCampaign.description,
//         ethers.parseEther(newCampaign.goal),
//         newCampaign.duration
//       );
      
//       await txn.wait();
//       setNewCampaign({ name: "", description: "", goal: "", duration: "" });
      
//       // Fetch updated campaigns and update stats
//       const updatedCampaigns = await fetchMyCampaigns();
//       await updateNGOStats(updatedCampaigns);
      
//       setNotification({
//         message: "Campaign created successfully!",
//         type: "success"
//       });
//     } catch (error) {
//       console.error("Error creating campaign:", error);
//       setError(error.message);
//       setNotification({
//         message: error.message || "Failed to create campaign",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchMyCampaigns = async () => {
//     if (!contract || isInitializing) return;

//     try {
//       setLoading(true);
//       const myCampaignIds = await contract.getMyCampaigns();
//       const campaignsData = [];

//       // Get proof metadata from localStorage (for quick access)
//       const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');

//       for (const id of myCampaignIds) {
//         const campaign = await contract.campaigns(id);
//         const campaignData = {
//           id: id.toString(),
//           name: campaign.name,
//           description: campaign.description,
//           goal: ethers.formatEther(campaign.goal),
//           raised: ethers.formatEther(campaign.balance),
//           deadline: new Date(Number(campaign.deadline) * 1000),
//           createdAt: Number(campaign.deadline) - (25), // Creation time (deadline - duration)
//           owner: campaign.owner,
//           state: ["Active", "Successful", "Failed"][campaign.state],
//           proofData: proofs[id] || null
//         };
//         campaignsData.push(campaignData);
//       }

//       setMyCampaigns(campaignsData);
      
//       // Update NGO stats in Firebase
//       updateNGOStats(campaignsData);
      
//     } catch (err) {
//       console.error("Error fetching campaigns:", err);
//       setError("Failed to fetch campaigns");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const withdrawFunds = useCallback(async (campaignId) => {
//     if (!contract || isInitializing) {
//       setError("Contract not initialized");
//       return;
//     }

//     setWithdrawingCampaignId(campaignId);
//     setLoading(true);
//     setError(null);

//     try {
//       // Get the provider and signer
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const signer = await provider.getSigner();
//       const signerAddress = await signer.getAddress();
//       console.log("Signer address:", signerAddress);
      
//       // Create a new contract instance with the signer
//       const contractAddress = contract.target;
//       console.log("Contract target address:", contractAddress);
      
//       // Get the ABI from the existing contract
//       const contractABI = contract.interface.fragments.map(fragment => {
//         return fragment.format('json');
//       });
//       console.log("Contract ABI fragments:", contractABI);
      
//       // Create new contract instance with signer
//       const contractWithSigner = new ethers.Contract(contractAddress, contract.interface, signer);
      
//       console.log("Contract address:", contractWithSigner.target);
//       console.log("Contract methods:", Object.keys(contractWithSigner).filter(k => typeof contractWithSigner[k] === 'function'));
      
//       // Verify we're on the right chain
//       const network = await provider.getNetwork();
//       console.log("Connected to network:", network);
      
//       // Check if campaign exists and get its details
//       try {
//         const campaign = await contractWithSigner.campaigns(campaignId);
//         console.log("Campaign details:", {
//           id: campaignId,
//           name: campaign.name,
//           owner: campaign.owner,
//           state: campaign.state,
//           balance: ethers.formatEther(campaign.balance),
//           goal: ethers.formatEther(campaign.goal),
//           deadline: new Date(Number(campaign.deadline) * 1000).toLocaleString()
//         });
        
//         // Verify campaign owner
//         if (campaign.owner.toLowerCase() !== signerAddress.toLowerCase()) {
//           throw new Error("Only campaign owner can withdraw funds");
//         }
        
//         // Verify campaign state
//         if (campaign.state.toString() !== "1") { // 1 = Successful
//           throw new Error("Campaign must be in Successful state to withdraw funds");
//         }
        
//         // Verify campaign has funds
//         if (campaign.balance.toString() === "0") {
//           throw new Error("Campaign has no funds to withdraw");
//         }
        
//         // Verify deadline has passed
//         const currentTime = Math.floor(Date.now() / 1000);
//         if (currentTime <= Number(campaign.deadline)) {
//           throw new Error("Cannot withdraw before campaign deadline");
//         }
        
//         // Debug: Check if withdrawFunds function exists in the contract
//         if (typeof contractWithSigner.withdrawFunds !== 'function') {
//           console.error("withdrawFunds function not found in contract. Available functions:", 
//             Object.getOwnPropertyNames(Object.getPrototypeOf(contractWithSigner))
//               .filter(name => typeof contractWithSigner[name] === 'function'));
//           throw new Error("Contract does not include withdrawFunds function. The ABI might be outdated or incorrect.");
//         }
        
//         // Test the transaction with staticCall
//         try {
//           console.log("Testing withdrawal with staticCall...");
//           // For ethers v6, use staticCall instead of callStatic
//           await contractWithSigner.withdrawFunds.staticCall(campaignId);
//           console.log("staticCall test successful");
//         } catch (staticError) {
//           console.error("staticCall test failed:", staticError);
//           throw new Error(`Transaction simulation failed: ${staticError.message}`);
//         }
//       } catch (campaignError) {
//         console.error("Campaign validation error:", campaignError);
//         throw campaignError;
//       }

//       // Set gas parameters for transaction
//       const feeData = await provider.getFeeData();
//       const gasPrice = feeData.gasPrice;
      
//       // Try to execute the transaction
//       console.log("Attempting withdrawal...");
//       try {
//         // Before making the transaction, add:
//         const gasEstimate = await contractWithSigner.withdrawFunds.estimateGas(campaignId);
//         const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer
        
//         // Then make the transaction with the gas limit:
//         const tx = await contractWithSigner.withdrawFunds(campaignId, {
//           gasLimit: gasLimit,
//           gasPrice: gasPrice // Use the gas price from getFeeData
//         });
        
//         console.log("Transaction sent:", tx.hash);
//         const receipt = await tx.wait();
//         console.log("Transaction receipt:", {
//           status: receipt.status,
//           blockNumber: receipt.blockNumber,
//           gasUsed: receipt.gasUsed.toString()
//         });
        
//         // Fetch updated campaigns and update stats
//         const updatedCampaigns = await fetchMyCampaigns();
//         await updateNGOStats(updatedCampaigns);
        
//         setNotification({
//           message: "Funds withdrawn successfully!",
//           type: "success"
//         });
//       } catch (estimateError) {
//         console.error("Gas estimation failed:", estimateError);
        
//         // If estimation fails, try with fixed gas limit
//         console.log("Trying with fixed gas limit...");
//         const tx = await contractWithSigner.withdrawFunds(campaignId, {
//           gasLimit: 300000,
//           gasPrice: gasPrice // Use the gas price from getFeeData here too
//         });
        
//         console.log("Transaction sent with fixed gas:", tx.hash);
//         const receipt = await tx.wait();
//         console.log("Transaction receipt:", receipt);
        
//         // Fetch updated campaigns and update stats
//         const updatedCampaigns = await fetchMyCampaigns();
//         await updateNGOStats(updatedCampaigns);
        
//         setNotification({
//           message: "Funds withdrawn successfully!",
//           type: "success"
//         });
//       }
//     } catch (error) {
//       console.error("Detailed error:", {
//         message: error.message,
//         code: error.code,
//         data: error.data,
//         transaction: error.transaction,
//         receipt: error.receipt
//       });
      
//       // Handle specific error messages
//       let errorMessage = "Failed to withdraw funds";
      
//       if (error.message.includes("goal")) {
//         errorMessage = "Campaign goal not met yet";
//       } else if (error.message.includes("owner")) {
//         errorMessage = "Only campaign owner can withdraw funds";
//       } else if (error.message.includes("state")) {
//         errorMessage = "Campaign must be successful to withdraw funds";
//       } else if (error.message.includes("deadline")) {
//         errorMessage = "Cannot withdraw before campaign deadline";
//       } else if (error.message.includes("undefined")) {
//         errorMessage = "Function 'withdrawFunds' not found in contract. The ABI might be incorrect.";
//       } else if (error.code === 'CALL_EXCEPTION') {
//         errorMessage = "Transaction failed. Please ensure the campaign is in the correct state and you have enough ETH for gas.";
//       } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
//         errorMessage = "Could not estimate gas. The transaction might fail.";
//       } else if (error.code === 'UNKNOWN_ERROR') {
//         errorMessage = `Transaction failed. Please check your wallet and try again. Details: ${error.message}`;
//       }
      
//       setError(errorMessage);
//       setNotification({
//         message: errorMessage,
//         type: "error"
//       });
//     } finally {
//         setLoading(false);
//       setWithdrawingCampaignId(null);
//     }
//   }, [contract, isInitializing, fetchMyCampaigns, currentAccount]);

//   const handleFileChange = (e, campaignId) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) { // 5MB limit
//         setError("File size should be less than 5MB");
//         return;
//       }
//       setProofFile(file);
//     }
//   };

//   const handleProofDescriptionChange = (e) => {
//     setProofDescription(e.target.value);
//   };

//   const handleProofSubmission = async (campaignId) => {
//     if (!contract || !proofFile || !proofDescription) {
//       setError("Please provide both a proof file and description");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       // Use the new saveProof function from proofUtils
//       // This will store the actual file in IndexedDB
//       await saveProof(
//         campaignId,
//         proofFile,
//         proofDescription,
//         currentAccount,
//         "NGO", // You might want to get this from user profile
//         myCampaigns.find(c => c.id === campaignId)?.name
//       );

//       // Clear form
//       setProofFile(null);
//       setProofDescription("");
      
//       // Refresh campaigns to show updated proof status
//       await fetchMyCampaigns();

//       setNotification({
//         message: "Proof submitted successfully",
//         type: "success"
//       });
//     } catch (err) {
//       console.error("Error submitting proof:", err);
//       setError(err.message || "Failed to submit proof");
//       setNotification({
//         message: err.message || "Failed to submit proof",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     if (tab === "dashboard") {
//       setViewProfile(false);
//     } else if (tab === "profile") {
//       setViewProfile(true);
//     }
//   };

//   const totalCampaigns = myCampaigns.length;
//   const totalFundsRaised = myCampaigns.reduce((sum, campaign) => sum + parseFloat(campaign.raised || 0), 0);

//   const styles = {
//     proofSubmissionForm: {
//       marginTop: '20px',
//       padding: '20px',
//       backgroundColor: '#f8f9fa',
//       borderRadius: '8px',
//       boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//     },
//     formGroup: {
//       marginBottom: '15px',
//     },
//     label: {
//       display: 'block',
//       marginBottom: '5px',
//       fontWeight: '500',
//       color: '#333',
//     },
//     fileInput: {
//       width: '100%',
//       padding: '8px',
//       border: '1px solid #ddd',
//       borderRadius: '4px',
//       marginBottom: '10px',
//     },
//     selectedFile: {
//       marginTop: '5px',
//       fontSize: '0.9em',
//       color: '#666',
//     },
//     textarea: {
//       width: '100%',
//       minHeight: '100px',
//       padding: '8px',
//       border: '1px solid #ddd',
//       borderRadius: '4px',
//       resize: 'vertical',
//     },
//     submitButton: {
//       backgroundColor: '#007bff',
//       color: 'white',
//       padding: '10px 20px',
//       border: 'none',
//       borderRadius: '4px',
//       cursor: 'pointer',
//       fontSize: '1em',
//       transition: 'background-color 0.2s',
//       ':hover': {
//         backgroundColor: '#0056b3',
//       },
//       ':disabled': {
//         backgroundColor: '#ccc',
//         cursor: 'not-allowed',
//       },
//     },
//   };

//   // Replace the old updateNGOStats with this new version
//   const updateNGOStats = async (campaignsData) => {
//     if (!currentUser || !currentAccount) return;
    
//     try {
//       // Calculate totals
//       const totalCampaigns = campaignsData.length;
//       const totalRaised = campaignsData.reduce((sum, campaign) => {
//         return sum + parseFloat(campaign.raised || 0);
//       }, 0);
      
//       console.log("Updating NGO stats:", { totalCampaigns, totalRaised });
      
//       // Get NGO profile data if not already available
//       const profileData = ngoProfileData || await fetchNGOProfileData();
      
//       // Prepare the update data
//       const updateData = {
//         campaignsCount: totalCampaigns,
//         totalRaised: totalRaised,
//         lastUpdated: new Date().toISOString(),
//         walletAddress: currentAccount, // Add wallet address
//       };

//       // Add NGO name if available from profile
//       if (profileData?.name) {
//         updateData.name = profileData.name;
//       }
      
//       // Batch update both collections
//       const batch = db.batch();
      
//       // Update users collection
//       const userRef = doc(db, 'users', currentUser.email);
//       const userDoc = await getDoc(userRef);
      
//       if (userDoc.exists()) {
//         batch.update(userRef, updateData);
//       } else {
//         batch.set(userRef, {
//           email: currentUser.email,
//           ...updateData
//         });
//       }
      
//       // Update ngoProfiles collection
//       const ngoProfilesRef = collection(db, 'ngoProfiles');
//       const q = query(ngoProfilesRef, where('email', '==', currentUser.email));
//       const querySnapshot = await getDocs(q);
      
//       if (!querySnapshot.empty) {
//         const profileDoc = querySnapshot.docs[0];
//         batch.update(doc(db, 'ngoProfiles', profileDoc.id), {
//           ...updateData,
//           email: currentUser.email // Ensure email is always present
//         });
//       } else {
//         // If no profile exists, create one
//         const newProfileRef = doc(collection(db, 'ngoProfiles'));
//         batch.set(newProfileRef, {
//           email: currentUser.email,
//           ...updateData
//         });
//       }
      
//       // Commit the batch
//       await batch.commit();
//       console.log("NGO stats and profile data updated successfully in both collections");
      
//     } catch (error) {
//       console.error("Error updating NGO stats:", error);
//       setError("Failed to update NGO statistics");
//     }
//   };

//   // Change this section to use local campaign data
//   const renderStatsCards = () => {
//     // Calculate stats from local campaign data
//     const totalCampaigns = myCampaigns.length;
//     const totalRaised = myCampaigns.reduce((sum, campaign) => sum + parseFloat(campaign.raised || 0), 0);
//     const completedCampaigns = myCampaigns.filter(c => c.state !== "Active").length;
//     const avgFulfillment = totalCampaigns > 0 ? Math.round((completedCampaigns / totalCampaigns) * 100) : 0;

//     return (
//       <div className="stats-grid">
//         <div className="stat-card">
//           <h3>Total Campaigns</h3>
//           <div className="stat-value">
//             {totalCampaigns}
//             <div className="stat-icon">📊</div>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <h3>Total Raised</h3>
//           <div className="stat-value">
//             <span className="currency">{selectedCurrency.symbol}</span>
//             {convertAmount(totalRaised.toString(), 'ETH')}
//             <div className="stat-icon">💰</div>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <h3>Avg. Fulfillment</h3>
//           <div className="stat-value">
//             {avgFulfillment}%
//             <div className="stat-icon">✅</div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // ProofDisplay component to render stored proof files
//   const ProofDisplay = ({ campaignId }) => {
//     const [proofData, setProofData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const containerRef = useRef(null);

//     useEffect(() => {
//       const loadProof = async () => {
//         if (!campaignId) return;
        
//         try {
//           setLoading(true);
//           setError(null);
          
//           // Get the proof data from IndexedDB
//           const proof = await getProof(campaignId);
//           if (proof) {
//             setProofData(proof);
//           }
//         } catch (err) {
//           console.error("Error loading proof:", err);
//           setError("Failed to load proof file");
//         } finally {
//           setLoading(false);
//         }
//       };
      
//       loadProof();
//     }, [campaignId]);
    
//     useEffect(() => {
//       // Display the proof file when proofData is available and the container is mounted
//       if (proofData && containerRef.current) {
//         const displayElement = containerRef.current;
        
//         // Handle different file types
//         if (proofData.fileType.startsWith('image/')) {
//           // For images
//           const img = document.createElement('img');
//           img.src = proofData.fileUrl;
//           img.alt = "Proof";
//           img.style.maxWidth = "100%";
//           img.style.borderRadius = "8px";
//           img.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          
//           displayElement.innerHTML = '';
//           displayElement.appendChild(img);
//         } else if (proofData.fileType === 'application/pdf') {
//           // For PDFs
//           displayElement.innerHTML = `
//             <iframe 
//               src="${proofData.fileUrl}" 
//               style="width: 100%; height: 300px; border: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
//             ></iframe>
//           `;
//         } else {
//           // For other file types
//           displayElement.innerHTML = `
//             <div class="file-display">
//               <div class="file-icon">
//                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                   <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
//                   <polyline points="14 2 14 8 20 8"></polyline>
//                   <line x1="16" y1="13" x2="8" y2="13"></line>
//                   <line x1="16" y1="17" x2="8" y2="17"></line>
//                   <polyline points="10 9 9 9 8 9"></polyline>
//                 </svg>
//               </div>
//               <div class="file-info">
//                 <p class="file-name">${proofData.filename}</p>
//                 <p class="file-details">Type: ${proofData.fileType} · Size: ${Math.round(proofData.fileSize / 1024)} KB</p>
//               </div>
//               <button 
//                 class="download-btn"
//                 onclick="window.open('${proofData.fileUrl}', '_blank')"
//               >
//                 View File
//               </button>
//             </div>
//           `;
//         }
//       }
//     }, [proofData]);
    
//     if (loading) {
//       return <div className="proof-loading">Loading proof...</div>;
//     }
    
//     if (error) {
//       return <div className="proof-error">{error}</div>;
//     }
    
//     if (!proofData) {
//       return <div className="no-proof">No proof file found</div>;
//     }
    
//     return (
//       <div className="proof-display">
//         <div className="proof-metadata">
//           <h4>Proof Details</h4>
//           <p><strong>Description:</strong> {proofData.description}</p>
//           <p><strong>Submitted:</strong> {new Date(proofData.timestamp).toLocaleString()}</p>
//           <p><strong>Status:</strong> {proofData.verified ? 'Verified' : 'Pending Verification'}</p>
//         </div>
//         <div className="proof-file-container" ref={containerRef}></div>
//       </div>
//     );
//   };

//   return (
//     <ErrorBoundary>
//       <Suspense fallback={<div>Loading...</div>}>
//         <motion.div 
//           className="dashboard-container"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5 }}
//         >
//           <AnimatePresence>
//             {notification && (
//               <motion.div
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//               >
//                 <div className={`notification ${notification.type}`}>
//                   {notification.message}
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Sidebar Navigation */}
//           <motion.div 
//             className="dashboard-sidebar"
//             initial={{ x: -50 }}
//             animate={{ x: 0 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <div className="sidebar-header">
//               <div className="user-info">
//                 <div className="user-avatar">
//                   {currentUser?.email?.charAt(0).toUpperCase()}
//                 </div>
//                 <p className="user-email">{currentUser?.email}</p>
//               </div>
//             </div>

//             <nav className="sidebar-nav">
//               <button 
//                 className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
//                 onClick={() => handleTabChange("dashboard")}
//               >
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
//                   <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
//                 </svg>
//                 Dashboard
//               </button>
              
//               <button 
//                 className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
//                 onClick={() => handleTabChange("profile")}
//               >
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
//                   <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
//                   <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
//                 </svg>
//                 My Profile
//               </button>
//             </nav>
//           </motion.div>

//           {/* Main Content */}
//           <div className="dashboard-content">
//             {!currentUser ? (
//               <div className="auth-message">
//                 <h2>Please sign in to access your dashboard</h2>
//                 <button onClick={() => navigate("/auth")} className="auth-button">
//                   Sign In
//                 </button>
//               </div>
//             ) : viewProfile ? (
//               <NGOProfile 
//                 userEmail={currentUser.email}
//               />
//             ) : (
//               <>
//                 {/* Dashboard Header */}
//                 <div className="content-header">
//                   <h1>Welcome Back, {currentUser?.email?.split('@')[0]}</h1>
//                   <p>Manage your campaigns and track donations</p>
//                 </div>

//                 {/* Stats Cards - Replace with the new function */}
//                 {renderStatsCards()}

//                 {/* Create Campaign Section */}
//                 <motion.div 
//                   className="create-campaign-section"
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.2 }}
//                 >
//                   <h2>Create New Campaign</h2>
//                   <form onSubmit={createCampaign} className="campaign-form">
//                     <div className="form-group">
//                       <input
//                         type="text"
//                         name="name"
//                         placeholder="Campaign Name"
//                         value={newCampaign.name}
//                         onChange={handleInputChange}
//                         required
//                       />
//                     </div>
//                     <div className="form-group">
//                       <textarea
//                         name="description"
//                         placeholder="Campaign Description"
//                         value={newCampaign.description}
//                         onChange={handleInputChange}
//                         required
//                       />
//                     </div>
//                     <div className="form-row">
//                       <div className="form-group">
//                         <input
//                           type="number"
//                           name="goal"
//                           placeholder="Goal (ETH)"
//                           value={newCampaign.goal}
//                           onChange={handleInputChange}
//                           required
//                         />
//                       </div>
//                       <div className="form-group">
//                         <input
//                           type="number"
//                           name="duration"
//                           placeholder="Duration (days)"
//                           value={newCampaign.duration}
//                           onChange={handleInputChange}
//                           required
//                         />
//                       </div>
//                     </div>
//                     <motion.button 
//                       type="submit" 
//                       className="submit-button"
//                       disabled={loading}
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                     >
//                       {loading ? (
//                         <span className="button-loader"></span>
//                       ) : (
//                         <>
//                           Create Campaign
//                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
//                             <path d="M12 4V20M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
//                           </svg>
//                         </>
//                       )}
//                     </motion.button>
//                   </form>
//                 </motion.div>

//                 {/* Campaigns List */}
//                 <div className="campaigns-section">
//                   <div className="campaigns-header">
//                     <h2>Your Campaigns</h2>
//                     <div className="campaign-filters">
//                       <div className="search-box">
//                         <input
//                           type="text"
//                           placeholder="Search campaigns..."
//                           value={searchTerm}
//                           onChange={(e) => setSearchTerm(e.target.value)}
//                           className="search-input"
//                         />
//                       </div>
//                       <div className="filter-controls">
//                         <select 
//                           value={statusFilter} 
//                           onChange={(e) => setStatusFilter(e.target.value)}
//                           className="filter-select"
//                         >
//                           <option value="all">All States</option>
//                           <option value="active">Active</option>
//                           <option value="successful">Successful</option>
//                           <option value="failed">Failed</option>
//                         </select>
                        
//                         <select 
//                           value={sortBy} 
//                           onChange={(e) => setSortBy(e.target.value)}
//                           className="filter-select"
//                         >
//                           <option value="newest">Newest First</option>
//                           <option value="oldest">Oldest First</option>
//                           <option value="highest_goal">Highest Goal</option>
//                           <option value="lowest_goal">Lowest Goal</option>
//                           <option value="highest_raised">Most Raised</option>
//                           <option value="lowest_raised">Least Raised</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>

//                   {myCampaigns.length === 0 ? (
//                     <div className="empty-state">
//                       <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
//                         <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="var(--primary)" strokeWidth="2"/>
//                         <path d="M12 12H15M12 16H15M9 8H15C15.5523 8 16 8.44772 16 9V17C16 17.5523 15.5523 18 15 18H9C8.44772 18 8 17.5523 8 17V9C8 8.44772 8.44772 8 9 8Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
//                       </svg>
//                       <p>No campaigns yet. Create your first campaign!</p>
//                     </div>
//                   ) : (
//                     <>
//                       <div className="campaigns-grid">
//                         {myCampaigns
//                           .filter(campaign => {
//                             // Apply search filter
//                             if (searchTerm && !campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) {
//                               return false;
//                             }
//                             // Apply status filter
//                             if (statusFilter !== "all" && campaign.state.toLowerCase() !== statusFilter) {
//                               return false;
//                             }
//                             return true;
//                           })
//                           .sort((a, b) => {
//                             switch (sortBy) {
//                               case "newest":
//                                 return new Date(b.deadline) - new Date(a.deadline);
//                               case "oldest":
//                                 return new Date(a.deadline) - new Date(b.deadline);
//                               case "highest_goal":
//                                 return parseFloat(b.goal) - parseFloat(a.goal);
//                               case "lowest_goal":
//                                 return parseFloat(a.goal) - parseFloat(b.goal);
//                               case "highest_raised":
//                                 return parseFloat(b.raised) - parseFloat(a.raised);
//                               case "lowest_raised":
//                                 return parseFloat(a.raised) - parseFloat(b.raised);
//                               default:
//                                 return 0;
//                             }
//                           })
//                           .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
//                           .map((campaign) => (
//                             <motion.div 
//                               key={campaign.id}
//                               className={`campaign-card ${campaign.state.toLowerCase()}`}
//                               initial={{ opacity: 0, y: 20 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ duration: 0.3 }}
//                             >
//                               <div className="campaign-header">
//                                 <h3>{campaign.name}</h3>
//                                 <div className="card-header-actions">
//                                   <span className={`status-badge ${campaign.state.toLowerCase()}`}>
//                                     {campaign.state}
//                                   </span>
//                                   {campaign.state === "Successful" && !campaign.proofData && (
//                                     <button 
//                                       className="proof-submit-button"
//                                       onClick={() => {
//                                         // Scroll to the proof submission form
//                                         document.getElementById(`proof-section-${campaign.id}`).scrollIntoView({ 
//                                           behavior: 'smooth' 
//                                         });
//                                       }}
//                                     >
//                                       Submit Proof
//                                     </button>
//                                   )}
//                                   {campaign.state === "Successful" && campaign.proofData && (
//                                     <span className="proof-submitted-badge">
//                                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <path d="M20 6L9 17l-5-5"></path>
//                                       </svg>
//                                       Proof Submitted
//                                     </span>
//                                   )}
//                                 </div>
//                               </div>

//                               <p className="campaign-description">{campaign.description}</p>

//                               <div className="campaign-stats">
//                                 <div className="stat-item">
//                                   <span className="stat-label">Goal:</span>
//                                   <span className="stat-value">
//                                     {convertAmount(campaign.goal, 'ETH')} {selectedCurrency.symbol}
//                                   </span>
//                                 </div>
//                                 <div className="stat-item">
//                                   <span className="stat-label">Raised:</span>
//                                   <span className="stat-value">
//                                     {convertAmount(campaign.raised, 'ETH')} {selectedCurrency.symbol}
//                                   </span>
//                                 </div>
//                                 <div className="stat-item">
//                                   <span className="stat-label">Progress:</span>
//                                   <div className="progress-bar">
//                                     <div 
//                                       className="progress-fill"
//                                       style={{ 
//                                         width: `${Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100)}%`
//                                       }}
//                                     />
//                                   </div>
//                                 </div>
//                               </div>

//                               {parseFloat(campaign.raised) >= parseFloat(campaign.goal) && (
//                                 <div className="withdraw-section" id={`proof-section-${campaign.id}`}>
//                                   <div className="withdraw-info">
//                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
//                                     </svg>
//                                     <div>
//                                       <h4>Campaign Goal Reached!</h4>
//                                       <p>Submit proof to withdraw {convertAmount(campaign.raised, 'ETH')} {selectedCurrency.symbol}</p>
//                                     </div>
//                                   </div>

//                                   {!campaign.proofData ? (
//                                     <div style={styles.proofSubmissionForm}>
//                                       <h3>Submit Proof of Fund Usage</h3>
//                                       <div style={styles.formGroup}>
//                                         <label style={styles.label} htmlFor={`proof-file-${campaign.id}`}>Upload Proof (PDF, JPG, PNG)</label>
//                                         <input
//                                           type="file"
//                                           id={`proof-file-${campaign.id}`}
//                                           accept=".pdf,.jpg,.jpeg,.png"
//                                           onChange={(e) => handleFileChange(e, campaign.id)}
//                                           style={styles.fileInput}
//                                         />
//                                         {proofFile && (
//                                           <div style={styles.selectedFile}>
//                                             Selected: {proofFile.name}
//                                           </div>
//                                         )}
//                                       </div>
//                                       <div style={styles.formGroup}>
//                                         <label style={styles.label} htmlFor={`proof-description-${campaign.id}`}>Description</label>
//                                         <textarea
//                                           id={`proof-description-${campaign.id}`}
//                                           value={proofDescription}
//                                           onChange={handleProofDescriptionChange}
//                                           placeholder="Describe how the funds were used..."
//                                           style={styles.textarea}
//                                         />
//                                       </div>
//                                       <button
//                                         style={styles.submitButton}
//                                         onClick={(e) => {
//                                           e.preventDefault();
//                                           handleProofSubmission(campaign.id);
//                                         }}
//                                         disabled={loading || !proofFile || !proofDescription.trim()}
//                                       >
//                                         {loading ? "Submitting..." : "Submit Proof"}
//                                       </button>
//                                     </div>
//                                   ) : !campaign.proofData.verified ? (
//                                     <div className="proof-container">
//                                       <div className="proof-pending">
//                                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                                           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
//                                         </svg>
//                                         Proof verification pending
//                                       </div>
//                                       <ProofDisplay campaignId={campaign.id} />
//                                     </div>
//                                   ) : (
//                                     <motion.div 
//                                       className="withdraw-section verified-proof"
//                                       initial={{ opacity: 0, height: 0 }}
//                                       animate={{ opacity: 1, height: "auto" }}
//                                     >
//                                       <ProofDisplay campaignId={campaign.id} />
//                                       <motion.button
//                                         className="withdraw-button"
//                                         onClick={() => withdrawFunds(campaign.id)}
//                                         disabled={loading && withdrawingCampaignId === campaign.id}
//                                         whileHover={{ scale: 1.02 }}
//                                         whileTap={{ scale: 0.98 }}
//                                       >
//                                         {loading && withdrawingCampaignId === campaign.id ? (
//                                           <span className="button-loader"></span>
//                                         ) : (
//                                           <>
//                                             Withdraw Funds
//                                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                                               <path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round"/>
//                                             </svg>
//                                           </>
//                                         )}
//                                       </motion.button>
//                                     </motion.div>
//                                   )}
//                                 </div>
//                               )}

//                               <div className="card-footer">
//                                 <span className="deadline">Deadline: {campaign.deadline.toLocaleDateString()}</span>
//                               </div>
//                             </motion.div>
//                           ))}
//                       </div>

//                       {/* Pagination */}
//                       {Math.ceil(myCampaigns.length / ITEMS_PER_PAGE) > 1 && (
//                         <div className="pagination">
//                           <button
//                             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                             disabled={currentPage === 1}
//                             className="pagination-button"
//                           >
//                             Previous
//                           </button>
//                           <span className="page-info">
//                             Page {currentPage} of {Math.ceil(myCampaigns.length / ITEMS_PER_PAGE)}
//                           </span>
//                           <button
//                             onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(myCampaigns.length / ITEMS_PER_PAGE)))}
//                             disabled={currentPage === Math.ceil(myCampaigns.length / ITEMS_PER_PAGE)}
//                             className="pagination-button"
//                           >
//                             Next
//                           </button>
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>
//               </>
//             )}
//           </div>
//         </motion.div>
//       </Suspense>
//     </ErrorBoundary>
//   );
// }

// export default NGODashboard;

import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useContract } from "../context/ContractContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { ethers } from "ethers";
import NGOProfile from "./NGOProfile";
import "../styles/NGODashboard.css";
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { saveProof, getProof, updateProofVerification, displayProofFile } from "../utils/proofUtils";

// Constants
const ITEMS_PER_PAGE = 6;
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ProofDisplay Component
const ProofDisplay = React.memo(({ campaignId }) => {
  const [proofData, setProofData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadProof = async () => {
      if (!campaignId) return;
      
      try {
        setLoading(true);
        setError(null);
        const proof = await getProof(campaignId);
        if (proof) setProofData(proof);
      } catch (err) {
        console.error("Error loading proof:", err);
        setError("Failed to load proof file");
      } finally {
        setLoading(false);
      }
    };
    
    loadProof();
  }, [campaignId]);
  
  useEffect(() => {
    if (!proofData || !containerRef.current) return;
    
    const displayElement = containerRef.current;
    
    if (proofData.fileType.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = proofData.fileUrl;
      img.alt = "Proof";
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      img.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      displayElement.innerHTML = '';
      displayElement.appendChild(img);
    } else if (proofData.fileType === 'application/pdf') {
      displayElement.innerHTML = `
        <iframe 
          src="${proofData.fileUrl}" 
          style="width: 100%; height: 300px; border: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
        ></iframe>
      `;
    } else {
      displayElement.innerHTML = `
        <div class="file-display">
          <div class="file-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="file-info">
            <p class="file-name">${proofData.filename}</p>
            <p class="file-details">Type: ${proofData.fileType} · Size: ${Math.round(proofData.fileSize / 1024)} KB</p>
          </div>
          <button 
            class="download-btn"
            onclick="window.open('${proofData.fileUrl}', '_blank')"
          >
            View File
          </button>
        </div>
      `;
    }
  }, [proofData]);
  
  if (loading) return <div className="proof-loading">Loading proof...</div>;
  if (error) return <div className="proof-error">{error}</div>;
  if (!proofData) return <div className="no-proof">No proof file found</div>;
  
  return (
    <div className="proof-display">
      <div className="proof-metadata">
        <h4>Proof Details</h4>
        <p><strong>Description:</strong> {proofData.description}</p>
        <p><strong>Submitted:</strong> {new Date(proofData.timestamp).toLocaleString()}</p>
        <p><strong>Status:</strong> {proofData.verified ? 'Verified' : 'Pending Verification'}</p>
      </div>
      <div className="proof-file-container" ref={containerRef}></div>
    </div>
  );
});

function NGODashboard() {
  // Hooks and Context
  const navigate = useNavigate();
  const { contract, currentAccount, isInitializing } = useContract();
  const { currentUser } = useAuth();
  const { selectedCurrency, convertAmount } = useCurrency();

  // State Management
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({ 
    name: "", 
    description: "", 
    goal: "", 
    duration: "" 
  });
  const [loading, setLoading] = useState(true);
  const [viewProfile, setViewProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [withdrawingCampaignId, setWithdrawingCampaignId] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofDescription, setProofDescription] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [ngoStats, setNgoStats] = useState({
    totalCampaigns: 0,
    totalRaised: 0
  });
  const [ngoProfileData, setNgoProfileData] = useState(null);

  // Refs
  const fileInputRef = useRef({});
  const unsubscribeRef = useRef(null);
  const mounted = useRef(false);

  // Memoized values
  const filteredCampaigns = useMemo(() => {
    return myCampaigns
      .filter(campaign => {
        if (searchTerm && !campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        if (statusFilter !== "all" && campaign.state.toLowerCase() !== statusFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest": return new Date(b.deadline) - new Date(a.deadline);
          case "oldest": return new Date(a.deadline) - new Date(b.deadline);
          case "highest_goal": return parseFloat(b.goal) - parseFloat(a.goal);
          case "lowest_goal": return parseFloat(a.goal) - parseFloat(b.goal);
          case "highest_raised": return parseFloat(b.raised) - parseFloat(a.raised);
          case "lowest_raised": return parseFloat(a.raised) - parseFloat(b.raised);
          default: return 0;
        }
      });
  }, [myCampaigns, searchTerm, statusFilter, sortBy]);

  const paginatedCampaigns = useMemo(() => {
    return filteredCampaigns.slice(
      (currentPage - 1) * ITEMS_PER_PAGE, 
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredCampaigns, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);
  }, [filteredCampaigns]);

  // Effect for mounting/unmounting
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  // Effect for authentication and initialization
  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/auth");
      return;
    }

    if (currentUser && currentAccount && !isInitializing) {
      fetchMyCampaigns();
    }
  }, [currentUser, currentAccount, isInitializing, navigate]);

  // Effect for contract event listeners
  useEffect(() => {
    if (!contract || !currentAccount || isInitializing) return;

    const cleanup = () => {
      if (contract) {
        contract.removeAllListeners("FundsWithdrawn");
        contract.removeAllListeners("CampaignCreated");
        contract.removeAllListeners("ContributionReceived");
      }
    };

    try {
      const onFundsWithdrawn = () => mounted.current && fetchMyCampaigns();
      const onCampaignCreated = (_, owner) => 
        owner.toLowerCase() === currentAccount.toLowerCase() && mounted.current && fetchMyCampaigns();
      const onContributionReceived = () => mounted.current && fetchMyCampaigns();

      contract.on("FundsWithdrawn", onFundsWithdrawn);
      contract.on("CampaignCreated", onCampaignCreated);
      contract.on("ContributionReceived", onContributionReceived);

      return cleanup;
    } catch (error) {
      console.error("Error setting up event listeners:", error);
      return cleanup;
    }
  }, [contract, currentAccount, isInitializing]);

  // Effect for profile data
  useEffect(() => {
    if (currentUser) {
      fetchNGOProfileData();
    }
  }, [currentUser]);

  // Effect for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.email);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setNgoStats(prev => ({
          ...prev,
          totalCampaigns: userData.campaignsCount || 0,
          totalRaised: userData.totalRaised || 0,
          name: userData.name,
          walletAddress: userData.walletAddress
        }));
      }
    });

    const ngoProfilesRef = collection(db, 'ngoProfiles');
    const q = query(ngoProfilesRef, where('email', '==', currentUser.email));
    const unsubscribeProfile = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const profileData = snapshot.docs[0].data();
        setNgoProfileData(profileData);
        setNgoStats(prev => ({
          ...prev,
          totalCampaigns: profileData.campaignsCount || 0,
          totalRaised: profileData.totalRaised || 0,
          name: profileData.name,
          walletAddress: profileData.walletAddress
        }));
      }
    });

    unsubscribeRef.current = () => {
      unsubscribeUser();
      unsubscribeProfile();
    };

    return () => unsubscribeRef.current();
  }, [currentUser]);

  // Helper Functions
  const fetchNGOProfileData = async () => {
    if (!currentUser) return null;
    
    try {
      const ngoProfilesRef = collection(db, 'ngoProfiles');
      const q = query(ngoProfilesRef, where('email', '==', currentUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const profileData = querySnapshot.docs[0].data();
        setNgoProfileData(profileData);
        return profileData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching NGO profile data:", error);
      return null;
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewCampaign(prev => ({ ...prev, [name]: value }));
  }, []);

  const updateNGOStats = useCallback(async (campaignsData) => {
    if (!currentUser || !currentAccount) return;
    
    try {
      const totalCampaigns = campaignsData.length;
      const totalRaised = campaignsData.reduce((sum, campaign) => {
        return sum + parseFloat(campaign.raised || 0);
      }, 0);
      
      const profileData = ngoProfileData || await fetchNGOProfileData();
      const updateData = {
        campaignsCount: totalCampaigns,
        totalRaised: totalRaised,
        lastUpdated: new Date().toISOString(),
        walletAddress: currentAccount,
      };

      if (profileData?.name) {
        updateData.name = profileData.name;
      }
      
      const batch = db.batch();
      const userRef = doc(db, 'users', currentUser.email);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        batch.update(userRef, updateData);
      } else {
        batch.set(userRef, {
          email: currentUser.email,
          ...updateData
        });
      }
      
      const ngoProfilesRef = collection(db, 'ngoProfiles');
      const q = query(ngoProfilesRef, where('email', '==', currentUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const profileDoc = querySnapshot.docs[0];
        batch.update(doc(db, 'ngoProfiles', profileDoc.id), {
          ...updateData,
          email: currentUser.email
        });
      } else {
        const newProfileRef = doc(collection(db, 'ngoProfiles'));
        batch.set(newProfileRef, {
          email: currentUser.email,
          ...updateData
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error("Error updating NGO stats:", error);
      setError("Failed to update NGO statistics");
    }
  }, [currentUser, currentAccount, ngoProfileData]);

  // Main Functions
  const fetchMyCampaigns = async () => {
    if (!contract || isInitializing) return;

    try {
      setLoading(true);
      const myCampaignIds = await contract.getMyCampaigns();
      const campaignsData = [];
      const proofs = JSON.parse(localStorage.getItem('campaignProofs') || '{}');

      for (const id of myCampaignIds) {
        const campaign = await contract.campaigns(id);
        campaignsData.push({
          id: id.toString(),
          name: campaign.name,
          description: campaign.description,
          goal: ethers.formatEther(campaign.goal),
          raised: ethers.formatEther(campaign.balance),
          deadline: new Date(Number(campaign.deadline) * 1000),
          createdAt: Number(campaign.deadline) - (25),
          owner: campaign.owner,
          state: ["Active", "Successful", "Failed"][campaign.state],
          proofData: proofs[id] || null
        });
      }

      setMyCampaigns(campaignsData);
      await updateNGOStats(campaignsData);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (e) => {
    e.preventDefault();
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!newCampaign.name || !newCampaign.description || !newCampaign.goal || !newCampaign.duration) {
        throw new Error("Please fill in all fields");
      }

      if (parseFloat(newCampaign.goal) <= 0) {
        throw new Error("Goal amount must be greater than 0");
      }

      if (parseInt(newCampaign.duration) <= 0) {
        throw new Error("Duration must be greater than 0");
      }

      const txn = await contract.createCampaign(
        newCampaign.name,
        newCampaign.description,
        ethers.parseEther(newCampaign.goal),
        newCampaign.duration
      );
      
      await txn.wait();
      setNewCampaign({ name: "", description: "", goal: "", duration: "" });
      
      const updatedCampaigns = await fetchMyCampaigns();
      await updateNGOStats(updatedCampaigns);
      
      setNotification({
        message: "Campaign created successfully!",
        type: "success"
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      setError(error.message);
      setNotification({
        message: error.message || "Failed to create campaign",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const withdrawFunds = useCallback(async (campaignId) => {
    if (!contract || isInitializing) {
      setError("Contract not initialized");
      return;
    }

    setWithdrawingCampaignId(campaignId);
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = new ethers.Contract(contract.target, contract.interface, signer);
      
      const campaign = await contractWithSigner.campaigns(campaignId);
      
      if (campaign.owner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
        throw new Error("Only campaign owner can withdraw funds");
      }
      
      if (campaign.state.toString() !== "1") {
        throw new Error("Campaign must be in Successful state to withdraw funds");
      }
      
      if (campaign.balance.toString() === "0") {
        throw new Error("Campaign has no funds to withdraw");
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime <= Number(campaign.deadline)) {
        throw new Error("Cannot withdraw before campaign deadline");
      }
      
      await contractWithSigner.withdrawFunds.staticCall(campaignId);

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      
      try {
        const gasEstimate = await contractWithSigner.withdrawFunds.estimateGas(campaignId);
        const gasLimit = gasEstimate.mul(120).div(100);
        
        const tx = await contractWithSigner.withdrawFunds(campaignId, {
          gasLimit: gasLimit,
          gasPrice: gasPrice
        });
        
        await tx.wait();
        const updatedCampaigns = await fetchMyCampaigns();
        await updateNGOStats(updatedCampaigns);
        
        setNotification({
          message: "Funds withdrawn successfully!",
          type: "success"
        });
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        const tx = await contractWithSigner.withdrawFunds(campaignId, {
          gasLimit: 300000,
          gasPrice: gasPrice
        });
        
        await tx.wait();
        const updatedCampaigns = await fetchMyCampaigns();
        await updateNGOStats(updatedCampaigns);
        
        setNotification({
          message: "Funds withdrawn successfully!",
          type: "success"
        });
      }
    } catch (error) {
      console.error("Detailed error:", error);
      
      let errorMessage = "Failed to withdraw funds";
      if (error.message.includes("goal")) errorMessage = "Campaign goal not met yet";
      else if (error.message.includes("owner")) errorMessage = "Only campaign owner can withdraw funds";
      else if (error.message.includes("state")) errorMessage = "Campaign must be successful to withdraw funds";
      else if (error.message.includes("deadline")) errorMessage = "Cannot withdraw before campaign deadline";
      else if (error.message.includes("undefined")) errorMessage = "Function 'withdrawFunds' not found in contract. The ABI might be incorrect.";
      else if (error.code === 'CALL_EXCEPTION') errorMessage = "Transaction failed. Please ensure the campaign is in the correct state and you have enough ETH for gas.";
      else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') errorMessage = "Could not estimate gas. The transaction might fail.";
      else if (error.code === 'UNKNOWN_ERROR') errorMessage = `Transaction failed. Please check your wallet and try again. Details: ${error.message}`;
      
      setError(errorMessage);
      setNotification({
        message: errorMessage,
        type: "error"
      });
    } finally {
      setLoading(false);
      setWithdrawingCampaignId(null);
    }
  }, [contract, isInitializing, fetchMyCampaigns, currentAccount]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > FILE_SIZE_LIMIT) {
      setError("File size should be less than 5MB");
      return;
    }
    setProofFile(file);
  };

  const handleProofSubmission = async (campaignId) => {
    if (!contract || !proofFile || !proofDescription) {
      setError("Please provide both a proof file and description");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await saveProof(
        campaignId,
        proofFile,
        proofDescription,
        currentAccount,
        "NGO",
        myCampaigns.find(c => c.id === campaignId)?.name
      );

      setProofFile(null);
      setProofDescription("");
      await fetchMyCampaigns();

      setNotification({
        message: "Proof submitted successfully",
        type: "success"
      });
    } catch (err) {
      console.error("Error submitting proof:", err);
      setError(err.message || "Failed to submit proof");
      setNotification({
        message: err.message || "Failed to submit proof",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setViewProfile(tab === "profile");
  };

  const renderStatsCards = () => {
    const totalCampaigns = myCampaigns.length;
    const totalRaised = myCampaigns.reduce((sum, campaign) => sum + parseFloat(campaign.raised || 0), 0);
    const completedCampaigns = myCampaigns.filter(c => c.state !== "Active").length;
    const avgFulfillment = totalCampaigns > 0 ? Math.round((completedCampaigns / totalCampaigns) * 100) : 0;

    return (
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Campaigns</h3>
          <div className="stat-value">
            {totalCampaigns}
            <div className="stat-icon">📊</div>
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Total Raised</h3>
          <div className="stat-value">
            <span className="currency">{selectedCurrency.symbol}</span>
            {convertAmount(totalRaised.toString(), 'ETH')}
            <div className="stat-icon">💰</div>
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Avg. Fulfillment</h3>
          <div className="stat-value">
            {avgFulfillment}%
            <div className="stat-icon">✅</div>
          </div>
        </div>
      </div>
    );
  };

  // Styles
  const proofSubmissionFormStyles = {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const formGroupStyles = {
    marginBottom: '15px',
  };

  const labelStyles = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#333',
  };

  const fileInputStyles = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '10px',
  };

  const selectedFileStyles = {
    marginTop: '5px',
    fontSize: '0.9em',
    color: '#666',
  };

  const textareaStyles = {
    width: '100%',
    minHeight: '100px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    resize: 'vertical',
  };

  const submitButtonStyles = {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#0056b3',
    },
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <motion.div 
          className="dashboard-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className={`notification ${notification.type}`}>
                  {notification.message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Navigation */}
          <motion.div 
            className="dashboard-sidebar"
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="sidebar-header">
              <div className="user-info">
                <div className="user-avatar">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                <p className="user-email">{currentUser?.email}</p>
              </div>
            </div>

            <nav className="sidebar-nav">
              <button 
                className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => handleTabChange("dashboard")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
                </svg>
                Dashboard
              </button>
              
              <button 
                className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => handleTabChange("profile")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                  <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
                </svg>
                My Profile
              </button>
            </nav>
          </motion.div>

          {/* Main Content */}
          <div className="dashboard-content">
            {!currentUser ? (
              <div className="auth-message">
                <h2>Please sign in to access your dashboard</h2>
                <button onClick={() => navigate("/auth")} className="auth-button">
                  Sign In
                </button>
              </div>
            ) : viewProfile ? (
              <NGOProfile userEmail={currentUser.email} />
            ) : (
              <>
                {/* Dashboard Header */}
                <div className="content-header">
                  <h1>Welcome Back, {currentUser?.email?.split('@')[0]}</h1>
                  <p>Manage your campaigns and track donations</p>
                </div>

                {/* Stats Cards */}
                {renderStatsCards()}

                {/* Create Campaign Section */}
                <motion.div 
                  className="create-campaign-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2>Create New Campaign</h2>
                  <form onSubmit={createCampaign} className="campaign-form">
                    <div className="form-group">
                      <input
                        type="text"
                        name="name"
                        placeholder="Campaign Name"
                        value={newCampaign.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        name="description"
                        placeholder="Campaign Description"
                        value={newCampaign.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <input
                          type="number"
                          name="goal"
                          placeholder="Goal (ETH)"
                          value={newCampaign.goal}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          name="duration"
                          placeholder="Duration (days)"
                          value={newCampaign.duration}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <motion.button 
                      type="submit" 
                      className="submit-button"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <span className="button-loader"></span>
                      ) : (
                        <>
                          Create Campaign
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4V20M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>

                {/* Campaigns List */}
                <div className="campaigns-section">
                  <div className="campaigns-header">
                    <h2>Your Campaigns</h2>
                    <div className="campaign-filters">
                      <div className="search-box">
                        <input
                          type="text"
                          placeholder="Search campaigns..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                      <div className="filter-controls">
                        <select 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">All States</option>
                          <option value="active">Active</option>
                          <option value="successful">Successful</option>
                          <option value="failed">Failed</option>
                        </select>
                        
                        <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value)}
                          className="filter-select"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="highest_goal">Highest Goal</option>
                          <option value="lowest_goal">Lowest Goal</option>
                          <option value="highest_raised">Most Raised</option>
                          <option value="lowest_raised">Least Raised</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {myCampaigns.length === 0 ? (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="var(--primary)" strokeWidth="2"/>
                        <path d="M12 12H15M12 16H15M9 8H15C15.5523 8 16 8.44772 16 9V17C16 17.5523 15.5523 18 15 18H9C8.44772 18 8 17.5523 8 17V9C8 8.44772 8.44772 8 9 8Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <p>No campaigns yet. Create your first campaign!</p>
                    </div>
                  ) : (
                    <>
                      <div className="campaigns-grid">
                        {paginatedCampaigns.map((campaign) => (
                          <motion.div 
                            key={campaign.id}
                            className={`campaign-card ${campaign.state.toLowerCase()}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="campaign-header">
                              <h3>{campaign.name}</h3>
                              <div className="card-header-actions">
                                <span className={`status-badge ${campaign.state.toLowerCase()}`}>
                                  {campaign.state}
                                </span>
                                {campaign.state === "Successful" && !campaign.proofData && (
                                  <button 
                                    className="proof-submit-button"
                                    onClick={() => {
                                      document.getElementById(`proof-section-${campaign.id}`).scrollIntoView({ 
                                        behavior: 'smooth' 
                                      });
                                    }}
                                  >
                                    Submit Proof
                                  </button>
                                )}
                                {campaign.state === "Successful" && campaign.proofData && (
                                  <span className="proof-submitted-badge">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M20 6L9 17l-5-5"></path>
                                    </svg>
                                    Proof Submitted
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="campaign-description">{campaign.description}</p>

                            <div className="campaign-stats">
                              <div className="stat-item">
                                <span className="stat-label">Goal:</span>
                                <span className="stat-value">
                                  {convertAmount(campaign.goal, 'ETH')} {selectedCurrency.symbol}
                                </span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-label">Raised:</span>
                                <span className="stat-value">
                                  {convertAmount(campaign.raised, 'ETH')} {selectedCurrency.symbol}
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

                            {parseFloat(campaign.raised) >= parseFloat(campaign.goal) && (
                              <div className="withdraw-section" id={`proof-section-${campaign.id}`}>
                                <div className="withdraw-info">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                  <div>
                                    <h4>Campaign Goal Reached!</h4>
                                    <p>Submit proof to withdraw {convertAmount(campaign.raised, 'ETH')} {selectedCurrency.symbol}</p>
                                  </div>
                                </div>

                                {!campaign.proofData ? (
                                  <div style={proofSubmissionFormStyles}>
                                    <h3>Submit Proof of Fund Usage</h3>
                                    <div style={formGroupStyles}>
                                      <label style={labelStyles} htmlFor={`proof-file-${campaign.id}`}>Upload Proof (PDF, JPG, PNG)</label>
                                      <input
                                        type="file"
                                        id={`proof-file-${campaign.id}`}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        style={fileInputStyles}
                                      />
                                      {proofFile && (
                                        <div style={selectedFileStyles}>
                                          Selected: {proofFile.name}
                                        </div>
                                      )}
                                    </div>
                                    <div style={formGroupStyles}>
                                      <label style={labelStyles} htmlFor={`proof-description-${campaign.id}`}>Description</label>
                                      <textarea
                                        id={`proof-description-${campaign.id}`}
                                        value={proofDescription}
                                        onChange={(e) => setProofDescription(e.target.value)}
                                        placeholder="Describe how the funds were used..."
                                        style={textareaStyles}
                                      />
                                    </div>
                                    <button
                                      style={submitButtonStyles}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleProofSubmission(campaign.id);
                                      }}
                                      disabled={loading || !proofFile || !proofDescription.trim()}
                                    >
                                      {loading ? "Submitting..." : "Submit Proof"}
                                    </button>
                                  </div>
                                ) : !campaign.proofData.verified ? (
                                  <div className="proof-container">
                                    <div className="proof-pending">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                      </svg>
                                      Proof verification pending
                                    </div>
                                    <ProofDisplay campaignId={campaign.id} />
                                  </div>
                                ) : (
                                  <motion.div 
                                    className="withdraw-section verified-proof"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                  >
                                    <ProofDisplay campaignId={campaign.id} />
                                    <motion.button
                                      className="withdraw-button"
                                      onClick={() => withdrawFunds(campaign.id)}
                                      disabled={loading && withdrawingCampaignId === campaign.id}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      {loading && withdrawingCampaignId === campaign.id ? (
                                        <span className="button-loader"></span>
                                      ) : (
                                        <>
                                          Withdraw Funds
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round"/>
                                          </svg>
                                        </>
                                      )}
                                    </motion.button>
                                  </motion.div>
                                )}
                              </div>
                            )}

                            <div className="card-footer">
                              <span className="deadline">Deadline: {campaign.deadline.toLocaleDateString()}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="pagination-button"
                          >
                            Previous
                          </button>
                          <span className="page-info">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default NGODashboard;