import React from "react";
import GanacheData from "../components/GanacheData";
import "../styles/Campaigns.css";

const Campaigns = () => {
  // Get currentAccount from localStorage
  const currentAccount = localStorage.getItem("walletAddress") || null;

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h1>Active Campaigns</h1>
        <p>Browse and contribute to ongoing fundraising campaigns</p>
      </div>
      
      <GanacheData currentAccount={currentAccount} />
    </div>
  );
};

export default Campaigns;