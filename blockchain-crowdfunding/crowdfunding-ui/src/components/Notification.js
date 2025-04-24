import React, { useEffect } from 'react';
import '../styles/Notification.css';

const Notification = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        {type === 'success' && <span className="icon">✓</span>}
        {type === 'error' && <span className="icon">✕</span>}
        {type === 'warning' && <span className="icon">⚠</span>}
        {type === 'info' && <span className="icon">ℹ</span>}
        <p>{message}</p>
      </div>
      {onClose && (
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default Notification; 