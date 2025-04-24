import React from "react";
import { Link } from "react-router-dom"; // ✅ Keep only Link if you don't use useNavigate
import "../styles/HeroSection.css";

const HeroSection = ({ openModal }) => {
  const navigate = useNavigate(); // Ensure navigate is defined

  return (
    <div className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h2 className="hero-title">Transparent Donation Tracking</h2>
          <p className="hero-subtitle">
            Powered by blockchain technology, our platform ensures complete transparency in donation tracking. Make a difference with confidence.
          </p>
          <div className="hero-buttons">
            {/* Fixed button structure */}
          <Link to="/donate" className="primary-button">Browse Campaigns</Link>
          <Link to="/auth" className="secondary-button">NGO Portal</Link>
          
          </div>
        </div>
        <div className="hero-image">
          <div className="blockchain-graphic">
            <div className="block-chain">
              <div className="block"></div>
              <div className="block"></div>
              <div className="block"></div>
            </div>
            <p className="blockchain-text">Secure • Transparent • Traceable</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;