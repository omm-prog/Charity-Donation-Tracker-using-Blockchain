import React, { useState } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import DemoVideoSection from "../components/DemoVideoSection";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <div className="landing-container">
      
      <HeroSection openModal={openModal} />
      <FeaturesSection />
      <DemoVideoSection />
      <FAQSection />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={closeModal}>×</button>
            <h3>Get Started</h3>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;