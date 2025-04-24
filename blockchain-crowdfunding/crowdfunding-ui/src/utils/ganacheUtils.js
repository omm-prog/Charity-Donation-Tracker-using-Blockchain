import { ethers } from "ethers";
import CrowdfundingArtifact from "../contracts/Crowdfunding.json";

// Connect to local Ganache
const GANACHE_URL = "http://127.0.0.1:7546"; // Updated Ganache URL with correct port
const CONTRACT_ADDRESS = "0x000D326D23a0cAaeaAd6e76F26aDC9A0D9648CE6";

// Create a provider connected to Ganache
const getGanacheProvider = () => {
  return new ethers.JsonRpcProvider(GANACHE_URL);
};

// Initialize contract with provider
const getContract = async () => {
  if (!CrowdfundingArtifact || !CrowdfundingArtifact.abi) {
    throw new Error('Contract ABI not found');
  }

  if (!window.ethereum) {
    throw new Error('Please install MetaMask to use this application');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CrowdfundingArtifact.abi, signer);

  if (!contract) {
    throw new Error('Failed to create contract instance');
  }

  return contract;
};

// Get all campaigns
export const getAllCampaigns = async () => {
  try {
    const contract = getContract();
    const campaignCount = await contract.campaignCount();
    
    const campaigns = [];
    for (let i = 0; i < campaignCount; i++) {
      const campaign = await contract.campaigns(i);
      campaigns.push({
        id: i,
        name: campaign.name,
        description: campaign.description,
        goal: ethers.formatEther(campaign.goal),
        deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
        owner: campaign.owner,
        state: ["Active", "Successful", "Failed"][campaign.state],
        balance: ethers.formatEther(campaign.balance),
        proofSubmitted: campaign.proofSubmitted,
        proofVerified: campaign.proofVerified
      });
    }
    
    return campaigns;
  } catch (error) {
    console.error("Error fetching campaigns from Ganache:", error);
    throw error;
  }
};

// Get campaign by ID
export const getCampaignById = async (campaignId) => {
  try {
    const contract = getContract();
    const campaign = await contract.campaigns(campaignId);
    
    return {
      id: campaignId,
      name: campaign.name,
      description: campaign.description,
      goal: ethers.formatEther(campaign.goal),
      deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
      owner: campaign.owner,
      state: ["Active", "Successful", "Failed"][campaign.state],
      balance: ethers.formatEther(campaign.balance),
      proofSubmitted: campaign.proofSubmitted,
      proofVerified: campaign.proofVerified
    };
  } catch (error) {
    console.error(`Error fetching campaign ${campaignId} from Ganache:`, error);
    throw error;
  }
};

// Get campaign contributors
export const getCampaignContributors = async (campaignId) => {
  try {
    const contract = getContract();
    const [contributors, amounts] = await contract.getContributors(campaignId);
    
    return contributors.map((contributor, index) => ({
      address: contributor,
      amount: ethers.formatEther(amounts[index])
    }));
  } catch (error) {
    console.error(`Error fetching contributors for campaign ${campaignId}:`, error);
    throw error;
  }
};

// Get campaigns by owner address
export const getCampaignsByOwner = async (ownerAddress) => {
  try {
    const contract = getContract();
    const campaignIds = await contract.userCampaigns(ownerAddress);
    
    const campaigns = [];
    for (const id of campaignIds) {
      const campaign = await contract.campaigns(id);
      campaigns.push({
        id: Number(id),
        name: campaign.name,
        description: campaign.description,
        goal: ethers.formatEther(campaign.goal),
        deadline: new Date(Number(campaign.deadline) * 1000).toLocaleDateString(),
        owner: campaign.owner,
        state: ["Active", "Successful", "Failed"][campaign.state],
        balance: ethers.formatEther(campaign.balance),
        proofSubmitted: campaign.proofSubmitted,
        proofVerified: campaign.proofVerified
      });
    }
    
    return campaigns;
  } catch (error) {
    console.error(`Error fetching campaigns for owner ${ownerAddress}:`, error);
    throw error;
  }
};

// Get admin address
export const getAdminAddress = async () => {
  try {
    const contract = getContract();
    return await contract.admin();
  } catch (error) {
    console.error("Error fetching admin address:", error);
    throw error;
  }
};

// Check if contract is paused
export const isContractPaused = async () => {
  try {
    const contract = getContract();
    return await contract.paused();
  } catch (error) {
    console.error("Error checking if contract is paused:", error);
    throw error;
  }
};

export { getContract, CONTRACT_ADDRESS }; 