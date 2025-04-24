import React, { useState } from "react";
import './About.css';
import { motion } from "framer-motion";
import { 
  FaHandHoldingHeart, 
  FaChartLine, 
  FaShieldAlt,
  FaLock, 
  FaHandshake, 
  FaMobileAlt, 
  FaUserShield, 
  FaAward,
  FaInfoCircle,
  FaEye,
  FaStar,
  FaCogs,
  FaRocket,
  FaEthereum
} from "react-icons/fa";

import { BsDiamond } from "react-icons/bs"; // ✅ Corrected icon

const About = () => {
  const [activeTab, setActiveTab] = useState("donors");

  const coreValues = [
    {
      icon: <FaHandHoldingHeart className="color-purple" />,
      title: "Impact-Driven",
      description: "Every donation is carefully tracked to maximize real-world impact on communities in need."
    },
    {
      icon: <FaChartLine className="color-blue" />,
      title: "Data-Focused",
      description: "We leverage analytics to ensure optimal allocation of resources across projects."
    },
    {
      icon: <FaShieldAlt className="color-green" />,
      title: "Secure & Transparent",
      description: "State-of-the-art encryption and blockchain verification maintain donation integrity."
    }
  ];

  const features = {
    donors: [
      { 
        icon: <FaChartLine className="color-blue" />, 
        title: "Real-time Impact Tracking", 
        description: "Monitor exactly how your donations are being utilized with live updates and progress reports."
      },
      { 
        icon: <FaLock className="color-green" />, 
        title: "Secure Transactions", 
        description: "All donations are processed through military-grade encryption and blockchain verification."
      },
      { 
        icon: <FaMobileAlt className="color-purple" />, 
        title: "Cross-Platform Access", 
        description: "Track your donations on any device through our responsive web app."
      }
    ],
    ngos: [
      { 
        icon: <FaUserShield className="color-green" />, 
        title: "Donor Verification", 
        description: "Access a network of pre-verified donors interested in supporting causes like yours."
      },
      { 
        icon: <FaHandshake className="color-blue" />, 
        title: "Partnership Opportunities", 
        description: "Connect with other NGOs for collaborative projects and resource sharing."
      },
      { 
        icon: <FaAward className="color-purple" />, 
        title: "Credibility Badges", 
        description: "Earn verification badges that boost your organization's trustworthiness to potential donors."
      }
    ]
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="about-page">
      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="hero-title">DONATIONTRACK</h1>
          <div className="tagline">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Blockchain-Verified
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Impact-Focused
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Donor-Empowered
            </motion.span>
          </div>
        </motion.div>
      </section>

      <div className="main-content">
        <motion.section 
          className="content-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="section-header">
            <div className="icon-circle">
              <FaInfoCircle />
            </div>
            <h2>OUR MISSION</h2>
          </div>
          <div className="section-content">
            <p>
              DonationTrack is an innovative platform built to bridge the gap between donors and NGOs 
              using blockchain technology. By implementing secure tracking systems and transparent 
              reporting mechanisms, we're creating a new standard for accountability in the 
              charitable sector.
            </p>
          </div>
        </motion.section>

        <motion.section 
          className="content-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="section-header">
            <div className="icon-circle">
              <FaStar />
            </div>
            <h2>CORE VALUES</h2>
          </div>
          <div className="grid-layout">
            {coreValues.map((value, index) => (
              <motion.div
                key={index}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * (index + 1) }}
              >
                <div className="icon-container">
                  {value.icon}
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section 
          className="content-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="section-header">
            <div className="icon-circle">
              <FaCogs />
            </div>
            <h2>KEY FEATURES</h2>
          </div>
          <div className="features-tabs">
            <button 
              className={`btn ${activeTab === "donors" ? "active" : ""}`}
              onClick={() => setActiveTab("donors")}
            >
              FOR DONORS
            </button>
            <button 
              className={`btn ${activeTab === "ngos" ? "active" : ""}`}
              onClick={() => setActiveTab("ngos")}
            >
              FOR NGOS
            </button>
          </div>
          <div className="grid-layout">
            {features[activeTab].map((feature, index) => (
              <motion.div
                key={index}
                className="card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="icon-container">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <section className="content-section">
          <div className="cta-container">
            <div className="section-header" style={{justifyContent: 'center'}}>
              <div className="icon-circle">
                <FaRocket />
              </div>
              <h2>READY TO EXPERIENCE THE FUTURE?</h2>
            </div>
            <p style={{ marginBottom: '2rem', textAlign: 'center' }}>
              See how our technical implementation creates a seamless user experience
            </p>
            <button className="btn" style={{ 
              padding: '1rem 2rem',
              fontSize: '1.2rem'
            }}>
              REQUEST LIVE DEMO
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
