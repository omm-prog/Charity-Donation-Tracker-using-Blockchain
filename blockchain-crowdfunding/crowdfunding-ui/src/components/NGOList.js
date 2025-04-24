import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ethers } from 'ethers';
import { useContract } from '../context/ContractContext';
import { useCurrency } from '../context/CurrencyContext';
import LoadingSpinner from './LoadingSpinner';
import '../styles/NGOList.css';

const NGOList = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCause, setFilterCause] = useState('all');
  const navigate = useNavigate();
  const { contract } = useContract();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [ngoStats, setNgoStats] = useState({});

  useEffect(() => {
    fetchNGOs();
  }, []);

  // Add a function to fetch campaign data from blockchain for an NGO
  const fetchNGOCampaignsFromBlockchain = async (walletAddress) => {
    if (!contract || !walletAddress) return { campaignsCount: 0, totalRaised: 0 };
    
    try {
      // Get all campaigns from the contract
      const campaignCount = await contract.campaignCount();
      let totalCampaigns = 0;
      let totalRaised = 0;

      // Iterate through all campaigns to find the ones owned by this walletAddress
      for (let i = 0; i < Number(campaignCount); i++) {
        const campaign = await contract.campaigns(i);
        
        // Check if this campaign belongs to the current NGO
        if (campaign.owner.toLowerCase() === walletAddress.toLowerCase()) {
          totalCampaigns++;
          totalRaised += parseFloat(ethers.formatEther(campaign.balance));
        }
      }

      return {
        campaignsCount: totalCampaigns,
        totalRaised: totalRaised
      };
    } catch (error) {
      console.error('Error fetching campaigns from blockchain:', error);
      return { campaignsCount: 0, totalRaised: 0 };
    }
  };

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      const ngoCollection = collection(db, 'users');
      const ngoSnapshot = await getDocs(ngoCollection);
      const ngoList = ngoSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.id,
        ...doc.data()
      }));

      // Fetch wallet addresses from ngoProfiles collection
      const ngoProfilesCollection = collection(db, 'ngoProfiles');
      const profilesSnapshot = await getDocs(ngoProfilesCollection);
      const profilesMap = {};
      
      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          profilesMap[data.email] = data.walletAddress;
        }
      });
      
      // Merge wallet addresses with NGO data
      const mergedNgoList = ngoList.map(ngo => ({
        ...ngo,
        walletAddress: profilesMap[ngo.email] || null
      }));
      
      setNgos(mergedNgoList);
      
      // Fetch blockchain stats for each NGO with a wallet address
      if (contract) {
        const statsPromises = mergedNgoList
          .filter(ngo => ngo.walletAddress)
          .map(async (ngo) => {
            const stats = await fetchNGOCampaignsFromBlockchain(ngo.walletAddress);
            return { email: ngo.email, stats };
          });
        
        const statsResults = await Promise.all(statsPromises);
        
        const statsMap = {};
        statsResults.forEach(result => {
          statsMap[result.email] = result.stats;
        });
        
        setNgoStats(statsMap);
      }
      
    } catch (error) {
      console.error('Error fetching NGOs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch stats when contract becomes available
  useEffect(() => {
    if (contract && ngos.length > 0) {
      const fetchStats = async () => {
        const statsPromises = ngos
          .filter(ngo => ngo.walletAddress)
          .map(async (ngo) => {
            const stats = await fetchNGOCampaignsFromBlockchain(ngo.walletAddress);
            return { email: ngo.email, stats };
          });
        
        const statsResults = await Promise.all(statsPromises);
        
        const statsMap = {};
        statsResults.forEach(result => {
          statsMap[result.email] = result.stats;
        });
        
        setNgoStats(statsMap);
      };
      
      fetchStats();
    }
  }, [contract, ngos]);

  const handleNGOClick = (ngo) => {
    if (ngo.walletAddress) {
      navigate(`/ngo-profile/${ngo.walletAddress}`);
    } else {
      console.log('No wallet address available for this NGO');
      // You could show a toast notification here
    }
  };

  const filteredNGOs = ngos.filter(ngo => {
    const matchesSearch = 
      ngo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.about?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCause = filterCause === 'all' || ngo.causes?.includes(filterCause);
    return matchesSearch && matchesCause;
  });

  const allCauses = [...new Set(ngos.flatMap(ngo => ngo.causes || []))];

  return (
    <div className="ngo-list-container">
      <div className="ngo-list-header">
        <h1>Our NGO Partners</h1>
        <p>Discover and support verified NGOs making a difference</p>
      </div>

      <div className="ngo-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search NGOs by name, description, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={filterCause}
          onChange={(e) => setFilterCause(e.target.value)}
          className="cause-filter"
        >
          <option value="all">All Causes</option>
          {allCauses.map(cause => (
            <option key={cause} value={cause}>{cause}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading NGOs...</p>
        </div>
      ) : filteredNGOs.length === 0 ? (
        <div className="no-results">
          <h3>No NGOs Found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="ngo-grid">
          {filteredNGOs.map((ngo) => (
            <motion.div
              key={ngo.id}
              className="ngo-card"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleNGOClick(ngo)}
            >
              <div className="ngo-logo">
                {ngo.logo ? (
                  <img src={ngo.logo} alt={ngo.name} />
                ) : (
                  <div className="ngo-initials">
                    {ngo.name?.charAt(0) || ngo.email?.charAt(0) || 'N'}
                  </div>
                )}
              </div>
              <div className="ngo-info">
                <h3>{ngo.name || 'Unnamed NGO'}</h3>
                <p className="ngo-email">{ngo.email}</p>
                <p className="ngo-about">{ngo.about || 'No description available'}</p>
                <p className="ngo-address">{ngo.address || 'Address not provided'}</p>
                <p className="ngo-contact">Contact: {ngo.contactEmail || 'Not provided'}</p>
                {ngo.causes && ngo.causes.length > 0 && (
                  <div className="ngo-causes">
                    {ngo.causes.map((cause, index) => (
                      <span key={index} className="cause-tag">{cause}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="ngo-stats">
                <div className="stat">
                  <span>Campaigns</span>
                  <strong>{ngoStats[ngo.email]?.campaignsCount || 0}</strong>
                </div>
                <div className="stat">
                  <span>Raised</span>
                  <strong>
                    {selectedCurrency.symbol}
                    {convertAmount(
                      (ngoStats[ngo.email]?.totalRaised || 0).toString(), 
                      'ETH'
                    )}
                  </strong>
                </div>
              </div>
              <button className="view-profile-btn">View Profile</button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NGOList;