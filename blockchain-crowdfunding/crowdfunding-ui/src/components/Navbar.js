import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import "../styles/Navbar.css";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = ({ currentAccount, connectWallet, disconnectWallet }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();
  const [isHovered, setIsHovered] = useState(false);
  const isLoggedIn = currentUser !== null;
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = async () => {
    try {
      // Disconnect wallet
      if (disconnectWallet) {
        disconnectWallet();
      }
      // Logout from auth
      await logout();
      // Navigate to home
      navigate('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav 
      className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="navbar-container">
        {/* Logo with hover effect */}
        <Link to="/" className="logo-link" onClick={closeMobileMenu}>
          <motion.h1 
            className="logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="logo-gradient">Donation</span>Track
          </motion.h1>
        </Link>

        {/* Mobile Menu Toggle Button */}
        <motion.button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          whileTap={{ scale: 0.95 }}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </motion.button>

        {/* Main Navigation - Regular + Mobile Menu */}
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <div className="mobile-menu-header">
            <h3>Menu</h3>
            <button className="mobile-close-button" onClick={closeMobileMenu}>
              <FaTimes />
            </button>
          </div>

          {/* Currency Selector */}
          <motion.div 
            className="currency-selector"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <select
              value={selectedCurrency.name}
              onChange={(e) => setSelectedCurrency(currencies[e.target.value])}
              className="currency-select"
            >
              {Object.values(currencies).map((currency) => (
                <option key={currency.name} value={currency.name}>
                  {currency.symbol} {currency.name}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Navigation Links */}
          <div className="nav-menu-items">
            {['About', 'Donate', 'NGO List', 'Contact'].map((item) => (
              <motion.div
                key={item}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to={item === 'NGO List' ? '/ngo-list' : `/${item.toLowerCase().replace(' ', '-')}`}
                  className="nav-link"
                  onClick={closeMobileMenu}
                >
                  {item}
                  <span className="nav-underline"></span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="nav-action-buttons">
            {/* NGO Portal/Dashboard Button */}
            <motion.button
              className="nav-button portal-button"
              onClick={() => {
                if (isLoggedIn) {
                  navigate('/ngo-dashboard');
                } else {
                  navigate('/auth');
                }
                closeMobileMenu();
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 5px 15px rgba(101, 84, 192, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoggedIn ? 'Dashboard' : 'NGO Portal'}
              <div className="button-hover-effect"></div>
            </motion.button>

            {/* Wallet Connection */}
            {!currentAccount ? (
              <motion.button
                onClick={() => {
                  connectWallet();
                  closeMobileMenu();
                }}
                className="wallet-button"
                whileHover={{
                  backgroundPosition: '100% 50%',
                  boxShadow: '0 5px 15px rgba(0, 206, 201, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.5 }}
              >
                <span>Connect Wallet</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11V13H13V16L20 12L13 8V11H3Z" fill="currentColor"/>
                  <path d="M3 16H5V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V8H3V6C3 3.79086 4.79086 2 7 2H17C19.2091 2 21 3.79086 21 6V18C21 20.2091 19.2091 22 17 22H7C4.79086 22 3 20.2091 3 18V16Z" fill="currentColor"/>
                </svg>
              </motion.button>
            ) : (
              <motion.button 
                className="wallet-button connected"
                onClick={() => {
                  disconnectWallet();
                  closeMobileMenu();
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 5px 15px rgba(0, 206, 201, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{`${currentAccount.slice(0, 4)}...${currentAccount.slice(-4)}`}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            )}

            {/* Logout Button */}
            {isLoggedIn && (
              <motion.button
                className="logout-button"
                onClick={handleLogout}
                whileHover={{
                  backgroundColor: 'rgba(255, 71, 87, 0.1)',
                  color: '#ff4757'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Logout</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17 16L21 12M21 12L17 8M21 12H7M13 16V17C13 18.1046 12.1046 19 11 19H7C5.89543 19 5 18.1046 5 17V7C5 5.89543 5.89543 5 7 5H11C12.1046 5 13 5.89543 13 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div className="mobile-backdrop" onClick={closeMobileMenu}></div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;