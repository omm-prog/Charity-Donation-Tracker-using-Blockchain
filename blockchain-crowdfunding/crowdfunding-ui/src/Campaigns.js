import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig"; // Import Firestore config
import { collection, getDocs } from "firebase/firestore";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "campaigns"));
        const campaignsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCampaigns(campaignsData);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <div>
      <h2>Campaigns</h2>
      <ul>
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <strong>Name:</strong> {campaign.name} <br />
            <strong>Creator:</strong> {campaign.creator} <br />
            <strong>Description:</strong> {campaign.description} <br />
            <strong>Goal:</strong> {campaign.goal} ETH <br />
            <strong>Duration:</strong> {campaign.duration} days <br />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Campaigns;
