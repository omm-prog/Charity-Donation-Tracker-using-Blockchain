import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaHome, FaHandHoldingHeart, FaInfoCircle, FaClipboardList, FaTimes } from 'react-icons/fa';
import '../styles/FloatingActionButton.css';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsOpen(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };
  
  const menuItems = [
    { icon: <FaHome />, label: 'Home', path: '/' },
    { icon: <FaHandHoldingHeart />, label: 'Donate', path: '/donate' },
    { icon: <FaClipboardList />, label: 'NGOs', path: '/ngo-list' },
    { icon: <FaInfoCircle />, label: 'About', path: '/about' },
  ];

  return (
    <div className={`floating-action-button-container ${isVisible ? 'visible' : 'hidden'}`}>
      <motion.button 
        className={`fab-main ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <FaTimes /> : <FaPlus />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fab-menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={item.path}
                className="fab-item"
                onClick={() => handleNavigation(item.path)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 0.05 * index }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="fab-icon">{item.icon}</span>
                <span className="fab-label">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <motion.div 
          className="fab-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton; 