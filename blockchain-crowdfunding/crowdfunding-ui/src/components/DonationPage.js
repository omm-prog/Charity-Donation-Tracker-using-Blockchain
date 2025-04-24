import React from "react";
import GanacheData from "./GanacheData";
import "../styles/DonationPage.css";

function DonationPage({ currentAccount }) {
  return (
    <div className="donation-page">
      <div className="donation-header">
        <h1>Support a Cause</h1>
        {!currentAccount && (
          <div className="wallet-warning">
            <p>Please connect your wallet to donate to campaigns.</p>
          </div>
        )}
      </div>
      <GanacheData currentAccount={currentAccount} />
    </div>
  );
}

export default DonationPage;