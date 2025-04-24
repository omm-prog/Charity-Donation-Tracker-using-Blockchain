import React, { useState } from "react";
import { 
  FaChartLine, 
  FaLock, 
  FaHandshake, 
  FaMobileAlt, 
  FaUserShield, 
  FaAward 
} from "react-icons/fa";
import "../styles/Features.css";

const Features = () => {
  const [activeTab, setActiveTab] = useState("donors");
  
  const features = {
    donors: [
      { 
        icon: <FaChartLine />, 
        title: "Real-time Impact Tracking", 
        description: "Monitor exactly how your donations are being utilized with live updates and progress reports.",
         },
      { 
        icon: <FaLock />, 
        title: "Secure Transactions", 
        description: "All donations are processed through military-grade encryption and blockchain verification.",
         },
      { 
        icon: <FaMobileAlt />, 
        title: "Cross-Platform Access", 
        description: "Track your donations on any device through our responsive web app or native mobile applications.",
       }
    ],
    ngos: [
      { 
        icon: <FaUserShield />, 
        title: "Donor Verification", 
        description: "Access a network of pre-verified donors interested in supporting causes like yours.",
        },
      { 
        icon: <FaHandshake />, 
        title: "Partnership Opportunities", 
        description: "Connect with other NGOs for collaborative projects and resource sharing.",
       },
      { 
        icon: <FaAward />, 
        title: "Credibility Badges", 
        description: "Earn verification badges that boost your organization's trustworthiness to potential donors.",
        }
    ]
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderFeatureCards = (featuresList) => {
    return featuresList.map((feature, index) => (
      <div key={index} className="feature-card">
        <div className="feature-icon">
          {feature.icon}
        </div>
        <div className="feature-content">
          <h3>{feature.title}</h3>
          <p className="feature-description">{feature.description}</p>
          
        </div>
      </div>
    ));
  };

  return (
    <div className="features-container">
      <div className="features-header">
        <h2>Why Choose DonationTrack?</h2>
        <p>Our platform leverages modern web technologies to create a seamless and secure donation experience</p>
      </div>
      
      <div className="features-tabs">
        <button 
          className={`tab-button ${activeTab === "donors" ? "active" : ""}`}
          onClick={() => handleTabChange("donors")}
        >
          For Donors
        </button>
        <button 
          className={`tab-button ${activeTab === "ngos" ? "active" : ""}`}
          onClick={() => handleTabChange("ngos")}
        >
          For NGOs
        </button>
      </div>
      
      <div className="features-list">
        {renderFeatureCards(features[activeTab])}
      </div>
      
     
      
      <div className="demo-cta">
        <h3>Experience the Platform Firsthand</h3>
        <p>See how our technical implementation creates a seamless user experience</p>
        <button className="demo-button">Request Live Demo</button>
      </div>
    </div>
  );
};

export default Features;