import React from "react";
import "../styles/FeaturesSection.css";

const FeaturesSection = () => {
  return (
    <div className="features-section">
      <div className="features-container">
        <h2 className="section-title">Why Choose DonationTrack?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Powerful Analytics</h3>
            <p className="feature-description">
              Track donation trends and gain insights to improve your fundraising strategies.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⛓️</div>
            <h3 className="feature-title">Blockchain Security</h3>
            <p className="feature-description">
              Every donation is recorded on the blockchain, ensuring transparency and security.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3 className="feature-title">Mobile Friendly</h3>
            <p className="feature-description">
              Access your dashboard from anywhere, on any device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;