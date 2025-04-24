import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/ToastNotification.css';

const ToastNotification = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`toast-notification ${type}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="toast-content">
          <span className="toast-icon">{icons[type]}</span>
          <p className="toast-message">{message}</p>
        </div>
        {onClose && (
          <button className="toast-close" onClick={onClose}>
            ×
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ToastNotification;