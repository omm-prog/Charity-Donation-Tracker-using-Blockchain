import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../styles/NGOProfile.css';

const NGOProfile = ({ userEmail }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    mission: '',
    vision: '',
    website: '',
    walletAddress: '',
    contactEmail: '',
    phone: '',
    address: '',
    foundingYear: '',
    logoUrl: '',
    causes: [],
    achievements: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    // New fields
    projects: [],
    impactMetrics: [],
    teamMembers: [],
    donationNeeds: '',
    volunteerOpportunities: '',
    testimonials: [],
    partners: [],
    legalInfo: {
      registrationNumber: '',
      taxStatus: '',
      country: ''
    },
    documents: [],
    gallery: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      if (!userEmail) {
        throw new Error('No user email provided');
      }

      const docRef = doc(db, 'users', userEmail);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const profileData = {
          ...data,
          causes: data.causes || [],
          socialMedia: data.socialMedia || {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
          },
          // Initialize new fields if they don't exist
          projects: data.projects || [],
          impactMetrics: data.impactMetrics || [],
          teamMembers: data.teamMembers || [],
          donationNeeds: data.donationNeeds || '',
          volunteerOpportunities: data.volunteerOpportunities || '',
          testimonials: data.testimonials || [],
          partners: data.partners || [],
          legalInfo: data.legalInfo || {
            registrationNumber: '',
            taxStatus: '',
            country: ''
          },
          documents: data.documents || [],
          gallery: data.gallery || []
        };
        setProfile(profileData);
        setFormData(profileData);
      } else {
        const defaultProfile = {
          name: '',
          about: '',
          mission: '',
          vision: '',
          website: '',
          walletAddress: '',
          contactEmail: userEmail,
          phone: '',
          address: '',
          foundingYear: '',
          logoUrl: '',
          causes: [],
          achievements: '',
          socialMedia: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
          },
          // Default values for new fields
          projects: [],
          impactMetrics: [],
          teamMembers: [],
          donationNeeds: '',
          volunteerOpportunities: '',
          testimonials: [],
          partners: [],
          legalInfo: {
            registrationNumber: '',
            taxStatus: '',
            country: ''
          },
          documents: [],
          gallery: []
        };
        setProfile(defaultProfile);
        setFormData(defaultProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userEmail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [name]: value
      }
    }));
  };

  const handleLegalInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      legalInfo: {
        ...prev.legalInfo,
        [name]: value
      }
    }));
  };

  const handleCausesChange = (e) => {
    const causes = e.target.value.split(',').map(item => item.trim());
    setFormData(prev => ({
      ...prev,
      causes: causes.filter(cause => cause) // Remove empty strings
    }));
  };

  const handleProjectsChange = (e) => {
    try {
      const projects = JSON.parse(e.target.value);
      setFormData(prev => ({
        ...prev,
        projects
      }));
    } catch {
      // If not valid JSON, treat as comma-separated
      const projects = e.target.value.split(',').map(item => {
        return { name: item.trim(), description: '' };
      });
      setFormData(prev => ({
        ...prev,
        projects: projects.filter(project => project.name)
      }));
    }
  };

  const handleImpactMetricsChange = (e) => {
    try {
      const impactMetrics = JSON.parse(e.target.value);
      setFormData(prev => ({
        ...prev,
        impactMetrics
      }));
    } catch {
      // If not valid JSON, treat as comma-separated
      const metrics = e.target.value.split(',').map(item => {
        const [metric, value] = item.split(':').map(s => s.trim());
        return { metric, value };
      });
      setFormData(prev => ({
        ...prev,
        impactMetrics: metrics.filter(m => m.metric && m.value)
      }));
    }
  };

  const handleTeamMembersChange = (e) => {
    try {
      const teamMembers = JSON.parse(e.target.value);
      setFormData(prev => ({
        ...prev,
        teamMembers
      }));
    } catch {
      // Simple comma-separated parsing for names only
      const members = e.target.value.split(',').map(item => {
        return { name: item.trim(), role: '', photo: '' };
      });
      setFormData(prev => ({
        ...prev,
        teamMembers: members.filter(member => member.name)
      }));
    }
  };

  const handleTestimonialsChange = (e) => {
    try {
      const testimonials = JSON.parse(e.target.value);
      setFormData(prev => ({
        ...prev,
        testimonials
      }));
    } catch {
      // Simple parsing for testimonials
      const testimonials = e.target.value.split('\n\n').map(item => {
        const parts = item.split(' - ');
        return {
          quote: parts[0]?.trim() || '',
          author: parts[1]?.trim() || '',
        };
      });
      setFormData(prev => ({
        ...prev,
        testimonials: testimonials.filter(t => t.quote)
      }));
    }
  };

  const handlePartnersChange = (e) => {
    const partners = e.target.value.split(',').map(item => item.trim());
    setFormData(prev => ({
      ...prev,
      partners: partners.filter(partner => partner)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const docRef = doc(db, 'users', userEmail);
      await setDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setProfile(formData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading profile data...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-card">
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    </div>
  );

  const renderEditForm = () => (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="form-tabs">
        <button 
          type="button" 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Basic Info
        </button>
        <button 
          type="button" 
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact
        </button>
        <button 
          type="button" 
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects & Impact
        </button>
        <button 
          type="button" 
          className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Team & Partners
        </button>
        <button 
          type="button" 
          className={`tab-button ${activeTab === 'legal' ? 'active' : ''}`}
          onClick={() => setActiveTab('legal')}
        >
          Legal & Documents
        </button>
        <button 
          type="button" 
          className={`tab-button ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Social & Media
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-group">
            <label>Organization Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>About *</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Mission Statement</label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Vision</label>
            <textarea
              name="vision"
              value={formData.vision}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Founding Year</label>
            <input
              type="text"
              name="foundingYear"
              value={formData.foundingYear}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Causes (comma separated)</label>
            <input
              type="text"
              value={formData.causes?.join(', ') || ''}
              onChange={handleCausesChange}
              placeholder="Education, Environment, Poverty"
            />
          </div>
          
          <div className="form-group">
            <label>Key Achievements</label>
            <textarea
              name="achievements"
              value={formData.achievements}
              onChange={handleInputChange}
              rows="4"
              placeholder="List your major achievements, one per line"
            />
          </div>

          <div className="form-group">
            <label>Logo URL</label>
            <input
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="form-section">
          <h2>Contact Information</h2>
          <div className="form-group">
            <label>Contact Email *</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Physical Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label>Crypto Wallet Address *</label>
            <input
              type="text"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleInputChange}
              placeholder="0x..."
              required
            />
          </div>
          
          <h3>Social Media</h3>
          <div className="social-media-grid">
            <div className="form-group">
              <label>Facebook</label>
              <input
                type="url"
                name="facebook"
                value={formData.socialMedia?.facebook || ''}
                onChange={handleSocialMediaChange}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div className="form-group">
              <label>Twitter</label>
              <input
                type="url"
                name="twitter"
                value={formData.socialMedia?.twitter || ''}
                onChange={handleSocialMediaChange}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>

            <div className="form-group">
              <label>Instagram</label>
              <input
                type="url"
                name="instagram"
                value={formData.socialMedia?.instagram || ''}
                onChange={handleSocialMediaChange}
                placeholder="https://instagram.com/yourprofile"
              />
            </div>

            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.socialMedia?.linkedin || ''}
                onChange={handleSocialMediaChange}
                placeholder="https://linkedin.com/company/yourorg"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="form-section">
          <h2>Projects & Impact</h2>
          
          <div className="form-group">
            <label>Projects (JSON or comma separated project names)</label>
            <textarea
              value={
                formData.projects.length > 0 && formData.projects[0].description
                  ? JSON.stringify(formData.projects, null, 2)
                  : formData.projects.map(p => p.name).join(', ')
              }
              onChange={handleProjectsChange}
              rows="6"
              placeholder='[{"name":"Project Name","description":"Description","startDate":"2023-01","endDate":"ongoing","image":""}] or simple comma separated list'
            />
            <small className="form-hint">Add your ongoing and past projects. For simple entries, just list project names separated by commas. For detailed entries, use JSON format.</small>
          </div>

          <div className="form-group">
            <label>Impact Metrics (JSON or "metric: value" comma separated)</label>
            <textarea
              value={
                formData.impactMetrics.length > 0
                  ? formData.impactMetrics.some(m => m.year)
                    ? JSON.stringify(formData.impactMetrics, null, 2)
                    : formData.impactMetrics.map(m => `${m.metric}: ${m.value}`).join(', ')
                  : ''
              }
              onChange={handleImpactMetricsChange}
              rows="4"
              placeholder='[{"metric":"People Served","value":"10,000+","year":"2023"}] or "People Served: 10,000+, Trees Planted: 5,000"'
            />
            <small className="form-hint">Highlight your organization's impact. Use simple "metric: value" pairs separated by commas, or JSON for more detail.</small>
          </div>

          <div className="form-group">
            <label>Current Donation Needs</label>
            <textarea
              name="donationNeeds"
              value={formData.donationNeeds}
              onChange={handleInputChange}
              rows="4"
              placeholder="Describe your current fundraising goals and how donations will be used"
            />
          </div>

          <div className="form-group">
            <label>Volunteer Opportunities</label>
            <textarea
              name="volunteerOpportunities"
              value={formData.volunteerOpportunities}
              onChange={handleInputChange}
              rows="4"
              placeholder="Describe how volunteers can help your organization"
            />
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="form-section">
          <h2>Team & Partners</h2>
          
          <div className="form-group">
            <label>Team Members (JSON or comma separated names)</label>
            <textarea
              value={
                formData.teamMembers.length > 0 && formData.teamMembers[0].role
                  ? JSON.stringify(formData.teamMembers, null, 2)
                  : formData.teamMembers.map(m => m.name).join(', ')
              }
              onChange={handleTeamMembersChange}
              rows="6"
              placeholder='[{"name":"John Doe","role":"Director","photo":"https://...","bio":"Short bio"}] or simple list of names'
            />
            <small className="form-hint">Add key team members. For simple entries, just list names separated by commas. For detailed entries with roles and photos, use JSON format.</small>
          </div>

          <div className="form-group">
            <label>Partners & Sponsors (comma separated)</label>
            <textarea
              value={formData.partners?.join(', ') || ''}
              onChange={handlePartnersChange}
              rows="3"
              placeholder="Organization A, Company B, Foundation C"
            />
          </div>

          <div className="form-group">
            <label>Testimonials (format: quote - author, separated by blank lines)</label>
            <textarea
              value={
                formData.testimonials.length > 0
                  ? formData.testimonials.map(t => `${t.quote} - ${t.author}`).join('\n\n')
                  : ''
              }
              onChange={handleTestimonialsChange}
              rows="6"
              placeholder="Their support changed our lives completely. - John Doe, Community Member

This organization is making a real difference. - Jane Smith, Local Teacher"
            />
          </div>
        </div>
      )}

      {activeTab === 'legal' && (
        <div className="form-section">
          <h2>Legal Information</h2>
          
          <div className="form-group">
            <label>Registration Number</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.legalInfo?.registrationNumber || ''}
              onChange={handleLegalInfoChange}
              placeholder="NGO or charity registration number"
            />
          </div>

          <div className="form-group">
            <label>Tax Status</label>
            <input
              type="text"
              name="taxStatus"
              value={formData.legalInfo?.taxStatus || ''}
              onChange={handleLegalInfoChange}
              placeholder="e.g., 501(c)(3), Registered Charity, etc."
            />
          </div>

          <div className="form-group">
            <label>Country of Registration</label>
            <input
              type="text"
              name="country"
              value={formData.legalInfo?.country || ''}
              onChange={handleLegalInfoChange}
            />
          </div>

          <div className="form-group">
            <label>Documents (JSON array of document links)</label>
            <textarea
              value={
                formData.documents.length > 0
                  ? JSON.stringify(formData.documents, null, 2)
                  : ''
              }
              onChange={(e) => {
                try {
                  const documents = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, documents }));
                } catch {
                  // Keep the raw text for now
                  setFormData(prev => ({ ...prev, documentsRaw: e.target.value }));
                }
              }}
              rows="4"
              placeholder='[{"title":"Annual Report 2023","url":"https://...","type":"PDF"},{"title":"Financial Statement","url":"https://...","type":"PDF"}]'
            />
            <small className="form-hint">Add links to annual reports, financial statements, or other public documents.</small>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="form-section">
          <h2>Media Gallery</h2>
          
          <div className="form-group">
            <label>Gallery (JSON array of image links)</label>
            <textarea
              value={
                formData.gallery.length > 0
                  ? JSON.stringify(formData.gallery, null, 2)
                  : ''
              }
              onChange={(e) => {
                try {
                  const gallery = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, gallery }));
                } catch {
                  // Keep the raw text for now
                  setFormData(prev => ({ ...prev, galleryRaw: e.target.value }));
                }
              }}
              rows="6"
              placeholder='[{"url":"https://...","caption":"Event description","date":"2023-06-12"},{"url":"https://...","caption":"Project launch","date":"2023-05-01"}]'
            />
            <small className="form-hint">Add photos from your events, projects, and activities. Use JSON format with URLs and captions.</small>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button 
          type="submit" 
          className="save-button"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        <button 
          type="button" 
          className="cancel-button"
          onClick={() => {
            setIsEditing(false);
            setFormData(profile);
          }}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const renderProfileView = () => (
    <div className="profile-view">
      {/* Hero Section */}
      <div className="profile-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          {profile?.logoUrl && (
            <img 
              src={profile.logoUrl} 
              alt={`${profile.name} logo`} 
              className="ngo-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <h1 className="hero-title">{profile?.name || 'Unnamed Organization'}</h1>
          {profile?.causes?.length > 0 && (
            <div className="hero-causes">
              {profile.causes.map((cause, index) => (
                <span key={index} className="cause-tag">{cause}</span>
              ))}
            </div>
          )}
          <div className="hero-quick-info">
            {profile?.foundingYear && <span><i className="far fa-calendar-alt"></i> Est. {profile.foundingYear}</span>}
            {profile?.address && <span><i className="fas fa-map-marker-alt"></i> {profile.address.split(',')[0]}</span>}
            {profile?.walletAddress && (
              <span className="wallet-badge">
                <i className="fas fa-wallet"></i> Crypto Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-info-circle"></i> About
        </button>
        <button 
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <i className="fas fa-project-diagram"></i> Projects
        </button>
        <button 
          className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <i className="fas fa-users"></i> Team
        </button>
        <button 
          className={`tab-button ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
        >
          <i className="fas fa-chart-line"></i> Impact
        </button>
        <button 
          className={`tab-button ${activeTab === 'donate' ? 'active' : ''}`}
          onClick={() => setActiveTab('donate')}
        >
          <i className="fas fa-hand-holding-heart"></i> Support
        </button>
        <button 
          className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <i className="fas fa-images"></i> Gallery
        </button>
      </div>

      {/* Tab Content Sections */}
      <div className="profile-tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-pane active">
            <div className="two-column-grid">
              <div className="column">
                <div className="card">
                  <h2>About Us</h2>
                  <p className="profile-description">{profile?.about || 'No description provided'}</p>
                  
                  {(profile?.mission || profile?.vision) && (
                    <div className="purpose-container">
                      {profile.mission && (
                        <div className="purpose-card mission">
                          <h4><i className="fas fa-bullseye"></i> Mission</h4>
                          <p>{profile.mission}</p>
                        </div>
                      )}
                      {profile.vision && (
                        <div className="purpose-card vision">
                          <h4><i className="fas fa-eye"></i> Vision</h4>
                          <p>{profile.vision}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {profile?.achievements && (
                  <div className="card">
                    <h3><i className="fas fa-trophy"></i> Key Achievements</h3>
                    <div className="achievements-list">
                      {profile.achievements.split('\n').filter(a => a.trim()).map((achievement, index) => (
                        <div key={index} className="achievement-item">
                          <span className="achievement-bullet">•</span>
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="column">
                <div className="card contact-card">
                  <h3><i className="fas fa-address-card"></i> Contact Information</h3>
                  <div className="contact-grid">
                    {profile?.contactEmail && (
                      <div className="contact-item">
                        <div className="contact-icon">
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div className="contact-details">
                          <span className="contact-label">Email</span>
                          <a href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a>
                        </div>
                      </div>
                    )}
                    
                    {profile?.phone && (
                      <div className="contact-item">
                        <div className="contact-icon">
                          <i className="fas fa-phone"></i>
                        </div>
                        <div className="contact-details">
                          <span className="contact-label">Phone</span>
                          <a href={`tel:${profile.phone}`}>{profile.phone}</a>
                        </div>
                      </div>
                    )}
                    
                    {profile?.address && (
                      <div className="contact-item">
                        <div className="contact-icon">
                          <i className="fas fa-map-marker-alt"></i>
                        </div>
                        <div className="contact-details">
                          <span className="contact-label">Address</span>
                          <address>{profile.address}</address>
                        </div>
                      </div>
                    )}
                    
                    {profile?.website && (
                      <div className="contact-item">
                        <div className="contact-icon">
                          <i className="fas fa-globe"></i>
                        </div>
                        <div className="contact-details">
                          <span className="contact-label">Website</span>
                          <a 
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {profile.website.replace(/(^\w+:|^)\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {(profile?.socialMedia?.facebook || profile?.socialMedia?.twitter || 
                    profile?.socialMedia?.instagram ||profile?.socialMedia?.instagram || profile?.socialMedia?.linkedin) && (
                      <div className="social-media-links">
                        <h4>Follow Us</h4>
                        <div className="social-icons">
                          {profile?.socialMedia?.facebook && (
                            <a href={profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="social-icon">
                              <i className="fab fa-facebook-f"></i>
                            </a>
                          )}
                          {profile?.socialMedia?.twitter && (
                            <a href={profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-icon">
                              <i className="fab fa-twitter"></i>
                            </a>
                          )}
                          {profile?.socialMedia?.instagram && (
                            <a href={profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-icon">
                              <i className="fab fa-instagram"></i>
                            </a>
                          )}
                          {profile?.socialMedia?.linkedin && (
                            <a href={profile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon">
                              <i className="fab fa-linkedin-in"></i>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {profile?.legalInfo && (profile?.legalInfo?.registrationNumber || profile?.legalInfo?.taxStatus) && (
                  <div className="card legal-card">
                    <h3><i className="fas fa-balance-scale"></i> Legal Information</h3>
                    <div className="legal-info-grid">
                      {profile.legalInfo.registrationNumber && (
                        <div className="legal-info-item">
                          <span className="legal-info-label">Registration Number:</span>
                          <span>{profile.legalInfo.registrationNumber}</span>
                        </div>
                      )}
                      {profile.legalInfo.taxStatus && (
                        <div className="legal-info-item">
                          <span className="legal-info-label">Tax Status:</span>
                          <span>{profile.legalInfo.taxStatus}</span>
                        </div>
                      )}
                      {profile.legalInfo.country && (
                        <div className="legal-info-item">
                          <span className="legal-info-label">Country:</span>
                          <span>{profile.legalInfo.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="tab-pane active">
            <h2>Our Projects</h2>
            {profile?.projects?.length > 0 ? (
              <div className="projects-grid">
                {profile.projects.map((project, index) => (
                  <div key={index} className="project-card">
                    {project.image && (
                      <div className="project-image">
                        <img src={project.image} alt={project.name} />
                      </div>
                    )}
                    <div className="project-content">
                      <h3>{project.name}</h3>
                      {project.description && <p>{project.description}</p>}
                      {(project.startDate || project.endDate) && (
                        <div className="project-period">
                          <i className="far fa-calendar-alt"></i>
                          {project.startDate && <span>{project.startDate}</span>}
                          {project.startDate && project.endDate && <span> - </span>}
                          {project.endDate && <span>{project.endDate}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-project-diagram empty-icon"></i>
                <p>No projects have been added yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="tab-pane active">
            <div className="two-column-grid">
              <div className="column">
                <h2>Our Team</h2>
                {profile?.teamMembers?.length > 0 ? (
                  <div className="team-grid">
                    {profile.teamMembers.map((member, index) => (
                      <div key={index} className="team-card">
                        {member.photo ? (
                          <div className="team-photo">
                            <img src={member.photo} alt={member.name} />
                          </div>
                        ) : (
                          <div className="team-photo placeholder">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                        <h3 className="team-name">{member.name}</h3>
                        {member.role && <p className="team-role">{member.role}</p>}
                        {member.bio && <p className="team-bio">{member.bio}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-users empty-icon"></i>
                    <p>No team members have been added yet.</p>
                  </div>
                )}
              </div>

              <div className="column">
                {profile?.partners?.length > 0 && (
                  <div className="card partners-card">
                    <h2>Our Partners & Sponsors</h2>
                    <div className="partners-list">
                      {profile.partners.map((partner, index) => (
                        <span key={index} className="partner-tag">{partner}</span>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.testimonials?.length > 0 && (
                  <div className="card testimonials-card">
                    <h2>Testimonials</h2>
                    <div className="testimonials-list">
                      {profile.testimonials.map((testimonial, index) => (
                        <div key={index} className="testimonial-item">
                          <div className="testimonial-quote">
                            <i className="fas fa-quote-left quote-icon"></i>
                            <p>{testimonial.quote}</p>
                          </div>
                          {testimonial.author && (
                            <div className="testimonial-author">
                              <p>— {testimonial.author}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Impact Tab */}
        {activeTab === 'impact' && (
          <div className="tab-pane active">
            <h2>Our Impact</h2>
            {profile?.impactMetrics?.length > 0 ? (
              <div className="impact-metrics-grid">
                {profile.impactMetrics.map((metric, index) => (
                  <div key={index} className="impact-metric-card">
                    <div className="impact-metric-value">{metric.value}</div>
                    <div className="impact-metric-name">{metric.metric}</div>
                    {metric.year && <div className="impact-metric-year">{metric.year}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-chart-line empty-icon"></i>
                <p>No impact metrics have been added yet.</p>
              </div>
            )}

            {profile?.achievements && (
              <div className="card achievements-card">
                <h3>Key Achievements</h3>
                <div className="achievements-list">
                  {profile.achievements.split('\n').filter(a => a.trim()).map((achievement, index) => (
                    <div key={index} className="achievement-item">
                      <span className="achievement-bullet">•</span>
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Donate Tab */}
        {activeTab === 'donate' && (
          <div className="tab-pane active">
            <div className="two-column-grid">
              <div className="column">
                <div className="card donation-card">
                  <h2>Support Our Cause</h2>
                  {profile?.donationNeeds ? (
                    <div className="donation-needs">
                      <h3>Current Needs</h3>
                      <p>{profile.donationNeeds}</p>
                    </div>
                  ) : (
                    <p>Help us make a difference by contributing to our mission.</p>
                  )}
                  
                  <div className="wallet-donation">
                    <h3>Donate Cryptocurrency</h3>
                    <div className="wallet-info">
                      <p>Send donations to our wallet address:</p>
                      <div className="wallet-address-container">
                        <code className="wallet-address">{profile?.walletAddress || 'No wallet address provided'}</code>
                        <button 
                          className="copy-button"
                          onClick={() => {
                            navigator.clipboard.writeText(profile?.walletAddress || '');
                            alert('Wallet address copied to clipboard!');
                          }}
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="column">
                {profile?.volunteerOpportunities && (
                  <div className="card volunteer-card">
                    <h2>Volunteer With Us</h2>
                    <div className="volunteer-opportunities">
                      <p>{profile.volunteerOpportunities}</p>
                      {profile?.contactEmail && (
                        <div className="volunteer-contact">
                          <p>Interested in volunteering? Contact us at:</p>
                          <a href={`mailto:${profile.contactEmail}?subject=Volunteering%20Inquiry`} className="contact-button">
                            <i className="fas fa-envelope"></i> {profile.contactEmail}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="tab-pane active">
            <h2>Photo Gallery</h2>
            {profile?.gallery?.length > 0 ? (
              <div className="gallery-grid">
                {profile.gallery.map((item, index) => (
                  <div key={index} className="gallery-item">
                    <img src={item.url} alt={item.caption || `Gallery image ${index + 1}`} />
                    {(item.caption || item.date) && (
                      <div className="gallery-caption">
                        {item.caption && <p>{item.caption}</p>}
                        {item.date && <span className="gallery-date">{item.date}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-images empty-icon"></i>
                <p>No gallery images have been added yet.</p>
              </div>
            )}

            {profile?.documents?.length > 0 && (
              <div className="documents-section">
                <h3>Documents & Reports</h3>
                <div className="documents-list">
                  {profile.documents.map((doc, index) => (
                    <a 
                      key={index} 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="document-link"
                    >
                      <div className="document-icon">
                        <i className={`fas fa-file-${doc.type?.toLowerCase() === 'pdf' ? 'pdf' : 'alt'}`}></i>
                      </div>
                      <div className="document-info">
                        <span className="document-title">{doc.title}</span>
                        {doc.type && <span className="document-type">{doc.type}</span>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="profile-actions">
        <button 
          onClick={() => setIsEditing(true)} 
          className="edit-profile-button"
        >
          <i className="fas fa-edit"></i> Edit Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="ngo-profile-container">
      {isEditing ? renderEditForm() : renderProfileView()}
    </div>
  );
};

export default NGOProfile;