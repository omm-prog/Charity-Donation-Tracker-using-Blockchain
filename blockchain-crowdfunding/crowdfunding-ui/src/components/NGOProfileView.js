import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ethers } from 'ethers';
import { useContract } from '../context/ContractContext';
import { useCurrency } from '../context/CurrencyContext';
import LoadingSpinner from './LoadingSpinner';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaGlobe, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/NGOProfileView.css';

const NGOProfileView = () => {
  const { walletAddress } = useParams();
  const [ngoData, setNgoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const { contract } = useContract();
  const { selectedCurrency, convertAmount } = useCurrency();
  const [blockchainStats, setBlockchainStats] = useState({
    campaignsCount: 0,
    totalRaised: 0,
    campaigns: []
  });

  useEffect(() => {
    const fetchNGOData = async () => {
      try {
        setLoading(true);
        setError(null);

        const ngoProfilesRef = collection(db, 'ngoProfiles');
        const ngoProfileQuery = query(ngoProfilesRef, where('walletAddress', '==', walletAddress));
        const ngoProfileSnapshot = await getDocs(ngoProfileQuery);

        if (ngoProfileSnapshot.empty) {
          throw new Error('NGO profile not found');
        }

        const ngoProfile = ngoProfileSnapshot.docs[0].data();
        const ngoEmail = ngoProfile.email;

        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('email', '==', ngoEmail));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          throw new Error('NGO data not found');
        }

        const userData = userSnapshot.docs[0].data();
        setNgoData(userData);

      } catch (err) {
        console.error('Error fetching NGO data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchNGOData();
    }
  }, [walletAddress]);

  // Fetch campaign data from blockchain
  useEffect(() => {
    const fetchCampaignsFromBlockchain = async () => {
      if (!contract || !walletAddress) return;
      
      try {
        setLoading(true);
        
        // Get all campaigns from the contract
        const campaignCount = await contract.campaignCount();
        let totalCampaigns = 0;
        let totalRaised = 0;
        const campaignsList = [];

        // Iterate through all campaigns to find the ones owned by this walletAddress
        for (let i = 0; i < Number(campaignCount); i++) {
          const campaign = await contract.campaigns(i);
          
          // Check if this campaign belongs to the current NGO
          if (campaign.owner.toLowerCase() === walletAddress.toLowerCase()) {
            totalCampaigns++;
            totalRaised += parseFloat(ethers.formatEther(campaign.balance));
            
            campaignsList.push({
              id: i.toString(),
              name: campaign.name,
              description: campaign.description,
              goal: ethers.formatEther(campaign.goal),
              raised: ethers.formatEther(campaign.balance),
              deadline: new Date(Number(campaign.deadline) * 1000),
              createdAt: Number(campaign.deadline) - (25), // Creation time (deadline - duration)
              owner: campaign.owner,
              state: ["Active", "Successful", "Failed"][campaign.state]
            });
          }
        }

        setBlockchainStats({
          campaignsCount: totalCampaigns,
          totalRaised: totalRaised,
          campaigns: campaignsList
        });
        
      } catch (error) {
        console.error('Error fetching campaigns from blockchain:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignsFromBlockchain();
  }, [contract, walletAddress]);

  const renderSocialLinks = () => {
    const { socialMedia } = ngoData;
    return (
      <div className="social-links">
        {socialMedia?.facebook && (
          <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer">
            <FaFacebook />
          </a>
        )}
        {socialMedia?.twitter && (
          <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
        )}
        {socialMedia?.instagram && (
          <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
        )}
        {socialMedia?.linkedin && (
          <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
        )}
      </div>
    );
  };

  const renderCampaigns = () => (
    <div className="campaigns-grid">
      {blockchainStats.campaigns.length === 0 ? (
        <p className="no-campaigns-message">No campaigns found for this NGO.</p>
      ) : (
        blockchainStats.campaigns.map((campaign) => (
          <div key={campaign.id} className={`campaign-card ${campaign.state.toLowerCase()}`}>
            <div className="campaign-header">
              <h3>{campaign.name}</h3>
              <span className={`status-badge ${campaign.state.toLowerCase()}`}>
                {campaign.state}
              </span>
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
            <div className="card-footer">
              <span className="deadline">Deadline: {campaign.deadline.toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderContactInfo = () => (
    <div className="contact-info">
      {ngoData.website && (
        <a href={ngoData.website} target="_blank" rel="noopener noreferrer" className="contact-item">
          <FaGlobe />
          <span>{ngoData.website}</span>
        </a>
      )}
      {ngoData.phone && (
        <div className="contact-item">
          <FaPhone />
          <span>{ngoData.phone}</span>
        </div>
      )}
      {ngoData.contactEmail && (
        <div className="contact-item">
          <FaEnvelope />
          <span>{ngoData.contactEmail}</span>
        </div>
      )}
      {ngoData.address && (
        <div className="contact-item">
          <FaMapMarkerAlt />
          <span>{ngoData.address}</span>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="projects-grid">
      {ngoData.projects?.map((project, index) => (
        <div key={index} className="project-card">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div className="project-status">
            <span>Status: {project.status}</span>
            {project.timeline && <span>Timeline: {project.timeline}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderImpactMetrics = () => (
    <div className="impact-metrics-grid">
      {ngoData.impactMetrics?.map((metric, index) => (
        <div key={index} className="impact-metric-card">
          <h3>{metric.metric}</h3>
          <div className="metric-value">{metric.value}</div>
        </div>
      ))}
    </div>
  );

  const renderTeam = () => (
    <div className="team-grid">
      {ngoData.teamMembers?.map((member, index) => (
        <div key={index} className="team-member-card">
          {member.photoUrl && <img src={member.photoUrl} alt={member.name} />}
          <h3>{member.name}</h3>
          <p className="member-role">{member.role}</p>
          <p>{member.bio}</p>
        </div>
      ))}
    </div>
  );

  const renderPartners = () => (
    <div className="partners-grid">
      {ngoData.partners?.map((partner, index) => (
        <div key={index} className="partner-card">
          {partner.logo && <img src={partner.logo} alt={partner.name} />}
          <h3>{partner.name}</h3>
          <p>{partner.description}</p>
          {partner.website && (
            <a 
              href={partner.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="partner-link"
            >
              Visit Website
            </a>
          )}
        </div>
      ))}
    </div>
  );

  const renderTestimonials = () => (
    <div className="testimonials-section">
      {ngoData.testimonials?.map((testimonial, index) => (
        <div key={index} className="testimonial-card">
          <p className="testimonial-text">"{testimonial.quote}"</p>
          <div className="testimonial-author">
            <strong>{testimonial.author}</strong>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGallery = () => (
    <div className="gallery-grid">
      {ngoData.gallery?.map((image, index) => (
        <img key={index} src={image.url} alt={image.caption} title={image.caption} />
      ))}
    </div>
  );

  const renderLegalInfo = () => (
    <div className="legal-info">
      <p><strong>Registration Number:</strong> {ngoData.legalInfo?.registrationNumber}</p>
      <p><strong>Tax Status:</strong> {ngoData.legalInfo?.taxStatus}</p>
      <p><strong>Country:</strong> {ngoData.legalInfo?.country}</p>
    </div>
  );

  if (loading) {
    return <div className="loading-container"><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!ngoData) {
    return (
      <div className="not-found-container">
        <h3>NGO Not Found</h3>
        <p>The requested NGO profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <div className="ngo-profile-container">
        <div className="profile-header">
          <div className="ngo-logo-placeholder">
            {ngoData.name?.charAt(0) || 'N'}
          </div>
          <h1>{ngoData.name}</h1>
          <p className="founding-year">Est. {ngoData.foundingYear}</p>
          {renderSocialLinks()}
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <h3>Total Campaigns</h3>
            <div className="stat-value">
              {blockchainStats.campaignsCount}
            </div>
          </div>
          
          <div className="stat-card">
            <h3>Total Raised</h3>
            <div className="stat-value">
              <span className="currency">{selectedCurrency.symbol}</span>
              {convertAmount(blockchainStats.totalRaised.toString(), 'ETH')}
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`tab-button ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            Campaigns
          </button>
          <button 
            className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button 
            className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team
          </button>
          <button 
            className={`tab-button ${activeTab === 'impact' ? 'active' : ''}`}
            onClick={() => setActiveTab('impact')}
          >
            Impact
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'about' && (
            <>
              <section className="about-section">
                <h2>About Us</h2>
                <p>{ngoData.about}</p>
                <div className="mission-vision">
                  <div className="mission">
                    <h3>Our Mission</h3>
                    <p>{ngoData.mission}</p>
                  </div>
                  <div className="vision">
                    <h3>Our Vision</h3>
                    <p>{ngoData.vision}</p>
                  </div>
                </div>
              </section>

              <section className="contact-section">
                <h2>Contact Information</h2>
                {renderContactInfo()}
              </section>

              <section className="causes-section">
                <h2>Our Causes</h2>
                <div className="causes-list">
                  {ngoData.causes?.map((cause, index) => (
                    <span key={index} className="cause-tag">{cause}</span>
                  ))}
                </div>
              </section>

              <section className="legal-section">
                <h2>Legal Information</h2>
                {renderLegalInfo()}
              </section>
            </>
          )}

          {activeTab === 'campaigns' && (
            <section className="campaigns-section">
              <h2>Campaigns</h2>
              {renderCampaigns()}
            </section>
          )}

          {activeTab === 'projects' && (
            <section className="projects-section">
              <h2>Our Projects</h2>
              {renderProjects()}
              {ngoData.donationNeeds && (
                <div className="donation-needs">
                  <h3>Current Donation Needs</h3>
                  <p>{ngoData.donationNeeds}</p>
                </div>
              )}
              {ngoData.volunteerOpportunities && (
                <div className="volunteer-opportunities">
                  <h3>Volunteer Opportunities</h3>
                  <p>{ngoData.volunteerOpportunities}</p>
                </div>
              )}
            </section>
          )}

          {activeTab === 'team' && (
            <section className="team-section">
              <h2>Our Team</h2>
              {renderTeam()}
            </section>
          )}

          {activeTab === 'impact' && (
            <section className="impact-section">
              <h2>Our Impact</h2>
              {renderImpactMetrics()}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default NGOProfileView; 