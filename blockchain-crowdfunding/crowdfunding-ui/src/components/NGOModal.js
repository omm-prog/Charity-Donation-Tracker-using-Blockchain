import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NGOModal.css";

const NGOModal = ({ closeModal }) => {
  const navigate = useNavigate();
  
  const handleLogin = () => {
    closeModal();
    navigate('/auth/login');
  };
  
  const handleSignup = () => {
    closeModal();
    navigate('/auth/signup');
  };
  
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>NGO Portal</h2>
          <button className="close-button" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body">
          <p>Access the NGO donation tracking system</p>
          <div className="modal-buttons">
            <button className="modal-button login-button" onClick={handleLogin}>
              Login
            </button>
            <button className="modal-button signup-button" onClick={handleSignup}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGOModal;