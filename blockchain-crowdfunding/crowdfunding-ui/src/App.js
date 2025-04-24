import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { BrowserProvider } from "ethers";
import { auth, signOut } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import LandingPage from "./components/LandingPage";
import NGODashboard from "./components/NGODashboard";
import DonationPage from "./components/DonationPage";
import AdminPanel from "./components/AdminPanel";
import About from "./pages/About";
import Campaigns from "./pages/Campaigns";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";
import AuthPage from "./components/AuthPage";
import Footer from "./components/Footer";
import SubmitProof from "./components/SubmitProof";
import NGOList from "./components/NGOList";
import NGOProfileView from "./components/NGOProfileView";
import FloatingActionButton from "./components/FloatingActionButton";
import { ContractProvider } from './context/ContractContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import CloudinaryTest from './components/CloudinaryTest';
import CloudinarySetup from './components/CloudinarySetup';
import "./App.css";

const ADMIN_EMAIL = "admin@example.com";

function App() {
  const [currentAccount, setCurrentAccount] = useState(localStorage.getItem("walletAddress") || null);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 800);

  useEffect(() => {
    checkWalletConnection();

    // Listen for authentication changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        localStorage.setItem("userData", JSON.stringify(firebaseUser));
      } else {
        localStorage.removeItem("userData");
      }
    });

    // Check screen size for responsive UI
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 800);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      unsubscribe(); // Cleanup auth listener
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  async function checkWalletConnection() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not detected!");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setCurrentAccount(accounts[0]);
    localStorage.setItem("walletAddress", accounts[0]);
  }

  async function disconnectWallet() {
    setCurrentAccount(null);
    localStorage.removeItem("walletAddress");
  }

  function logout() {
    signOut(auth);
    setCurrentAccount(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("walletAddress");
  }

  return (
    <AuthProvider>
      <ContractProvider>
        <CurrencyProvider>
          <NotificationProvider>
            <Router>
              <div className="app">
                <Navbar 
                  currentAccount={currentAccount} 
                  connectWallet={connectWallet}
                  disconnectWallet={disconnectWallet}
                  logout={logout}
                />

                <main>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/donate" element={<DonationPage currentAccount={currentAccount} />} />
                    <Route path="/donate/:id" element={<DonationPage currentAccount={currentAccount} />} />
                    <Route path="/campaign/:id" element={<DonationPage currentAccount={currentAccount} />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/ngo-list" element={<NGOList />} />
                    <Route path="/ngo-profile/:walletAddress" element={<NGOProfileView />} />

                    {/* Protected NGO Dashboard Route */}
                    <Route
                      path="/ngo-dashboard"
                      element={<NGODashboard currentAccount={currentAccount} />}
                    />

                    {/* Protected Submit Proof Route */}
                    <Route
                      path="/submit-proof/:id"
                      element={<SubmitProof currentAccount={currentAccount} />}
                    />

                    {/* Protected Admin Route */}
                    <Route
                      path="/admin"
                      element={<AdminPanel currentAccount={currentAccount} />}
                    />

                    {/* Add the CloudinaryTest route */}
                    <Route path="/cloudinary-test" element={<CloudinaryTest />} />

                    {/* Add the CloudinarySetup route */}
                    <Route path="/cloudinary-setup" element={<CloudinarySetup />} />
                  </Routes>
                </main>

                {/* FloatingActionButton for mobile navigation */}
                <FloatingActionButton />
                
                <Footer />
              </div>
            </Router>
          </NotificationProvider>
        </CurrencyProvider>
      </ContractProvider>
    </AuthProvider>
  );
}

export default App;