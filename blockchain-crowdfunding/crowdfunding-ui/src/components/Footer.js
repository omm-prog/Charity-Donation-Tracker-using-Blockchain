import React from "react";
import { motion } from "framer-motion";
import "../styles/Footer.css";

const Footer = () => {
  const footerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.footer 
      className="footer"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={footerVariants}
    >
      <div className="footer-container">
        {/* Brand Section */}
        <motion.div 
          className="footer-section brand-section"
          variants={itemVariants}
        >
          <motion.h3 
            className="footer-title"
            whileHover={{ x: 5 }}
          >
            <span className="logo-gradient">Donation</span>Track
          </motion.h3>
          <p className="footer-description">
            Blockchain-powered donation tracking for complete transparency.
          </p>
          
          <div className="social-links">
            {['twitter', 'discord', 'github', 'telegram'].map((social) => (
              <motion.a
                key={social}
                href="#"
                className={`social-link ${social}`}
                whileHover={{ y: -5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <img 
                  src={`/icons/${social}.svg`} 
                  alt={social} 
                  width={24}
                  height={24}
                />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Links Sections */}
        {['Quick Links', 'Resources', 'Legal'].map((section, index) => (
          <motion.div 
            key={index}
            className="footer-section"
            variants={itemVariants}
          >
            <h3 className="footer-title">{section}</h3>
            <ul className="footer-links-list">
              {getLinksForSection(section).map((link, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 5 }}
                >
                  <a href="#" className="footer-link">
                    {link}
                    <span className="link-underline"></span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}

        {/* Newsletter */}
        <motion.div 
          className="footer-section newsletter"
          variants={itemVariants}
        >
          <h3 className="footer-title">Stay Updated</h3>
          <p>Subscribe to our newsletter for the latest updates</p>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Your email" 
              className="newsletter-input"
            />
            <motion.button
              className="newsletter-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <motion.div 
        className="footer-bottom"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p className="copyright">© 2025 DonationTrack. All rights reserved.</p>
        <div className="legal-links">
          <a href="#" className="legal-link">Privacy Policy</a>
          <a href="#" className="legal-link">Terms of Service</a>
          <a href="#" className="legal-link">Cookies</a>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <div className="footer-floating">
        <div className="floating-circle"></div>
        <div className="floating-square"></div>
      </div>
    </motion.footer>
  );
};

// Helper function for section links
const getLinksForSection = (section) => {
  switch(section) {
    case 'Quick Links':
      return ['Home', 'About', 'Campaigns', 'NGO Portal'];
    case 'Resources':
      return ['Documentation', 'Blog', 'Help Center', 'Community'];
    case 'Legal':
      return ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Licenses'];
    default:
      return [];
  }
};

export default Footer;