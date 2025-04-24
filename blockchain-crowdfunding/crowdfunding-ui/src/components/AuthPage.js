import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebaseConfig.js";
import { collection, doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import '../styles/AuthPage.css';

function AuthPage() {  
  const { setCurrentUser } = useAuth();
  const [isRegistered, setIsRegistered] = useState(true);
  const [formData, setFormData] = useState({
    ngoName: "",
    ngoEmail: "",
    password: "",
    otp: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [step, setStep] = useState("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const toggleForm = () => {
    setIsRegistered(!isRegistered);
    setMessage({ text: "", type: "" });
    setStep("initial");
    setFormData({
      ngoName: "",
      ngoEmail: "",
      password: "",
      otp: ""
    });
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleVerification = async () => {
    setIsLoading(true);
    try {
      if (isRegistered) {
        // Login process
        const response = await axios.post("http://127.0.0.1:5000/login", { 
          email: formData.ngoEmail, 
          password: formData.password 
        });

        if (response.status === 200) {
          const userData = { 
            email: formData.ngoEmail, 
            name: response.data.ngo_name, 
            uid: response.data.uid 
          };

          sessionStorage.setItem("userData", JSON.stringify(userData));
          setCurrentUser(userData);
          
          navigate(formData.ngoEmail === "admin@example.com" ? "/admin" : "/ngo-dashboard");
        }
      } else {
        // NGO verification flow
        const response = await axios.post("http://127.0.0.1:5000/verify-ngo", { 
          ngo_name: formData.ngoName, 
          ngo_email: formData.ngoEmail 
        });

        if (response.status === 200) {
          sessionStorage.setItem("temp_ngo_email", formData.ngoEmail);
          sessionStorage.setItem("temp_ngo_name", formData.ngoName);
          setStep("otp");
          setMessage({ text: "OTP sent to your email", type: "success" });
        }
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || "An error occurred", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/verify-otp", { 
        ngo_email: formData.ngoEmail, 
        otp: formData.otp 
      });

      if (response.status === 200) {
        setStep("signup");
        setMessage({ 
          text: "OTP verified successfully. Please set your password.", 
          type: "success" 
        });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || "Invalid OTP", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validatePassword(formData.password)) {
      setMessage({ 
        text: "Password must be at least 6 characters", 
        type: "error" 
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/complete-signup", { 
        ngo_email: formData.ngoEmail, 
        password: formData.password 
      });

      if (response.status === 200) {
        const userData = { 
          email: formData.ngoEmail, 
          name: response.data.ngo_name, 
          uid: response.data.uid 
        };

        const userRef = doc(collection(db, "users"), userData.uid);
        await setDoc(userRef, {
          name: userData.name,
          email: userData.email,
          uid: userData.uid,
          createdAt: new Date()
        });

        sessionStorage.setItem("userData", JSON.stringify(userData));
        setCurrentUser(userData);
        navigate("/ngo-dashboard");
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || "Registration failed", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="auth-glass-card">
        {/* Header */}
        <motion.div 
          className="auth-header"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="auth-title">
            {isRegistered ? "Welcome Back" : "Join Us"}
          </h2>
          <p className="auth-subtitle">
            {isRegistered 
              ? "Login to your NGO account" 
              : "Create your account in minutes"}
          </p>
        </motion.div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="auth-form-container"
          >
            {step === "initial" && (
              <>
                {!isRegistered && (
                  <div className="form-group">
                    <label htmlFor="ngoName">NGO Name</label>
                    <input
                      id="ngoName"
                      type="text"
                      placeholder="Enter your NGO name"
                      value={formData.ngoName}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="ngoEmail">Email</label>
                  <input
                    id="ngoEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.ngoEmail}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>

                {isRegistered && (
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        className="auth-input"
                      />
                      <button 
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === "otp" && (
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  className="auth-input"
                />
                <p className="otp-info">
                  We've sent a verification code to {formData.ngoEmail}
                </p>
              </div>
            )}

            {step === "signup" && (
              <div className="form-group">
                <label htmlFor="password">Create Password</label>
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="auth-input"
                  />
                  <button 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="password-strength">
                  Password strength: 
                  <span className={validatePassword(formData.password) ? "strong" : "weak"}>
                    {validatePassword(formData.password) ? " Strong" : " Weak"}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Message */}
        {message.text && (
          <motion.div 
            className={`auth-message ${message.type}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message.text}
          </motion.div>
        )}

        {/* Actions */}
        <div className="auth-actions">
          <motion.button
            className="auth-button primary"
            onClick={step === "initial" ? handleVerification : step === "otp" ? verifyOTP : handleSignup}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="loader"></span>
            ) : (
              <>
                {step === "initial" && (isRegistered ? "Login" : "Continue")}
                {step === "otp" && "Verify OTP"}
                {step === "signup" && "Complete Registration"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </motion.button>

          <button 
            className="auth-toggle"
            onClick={toggleForm}
            type="button"
          >
            {isRegistered 
              ? "Don't have an account? Register" 
              : "Already have an account? Login"}
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="auth-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-blur"></div>
      </div>
    </motion.div>
  );
}

export default AuthPage;