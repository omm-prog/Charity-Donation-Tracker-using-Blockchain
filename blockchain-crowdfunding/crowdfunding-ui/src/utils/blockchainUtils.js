import { ethers } from 'ethers';
import CrowdfundingArtifact from '../contracts/Crowdfunding.json';

const CONTRACT_ADDRESS = "0x000D326D23a0cAaeaAd6e76F26aDC9A0D9648CE6";

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
    const contract = await getContract();
    const campaignCount = await contract.getCampaignCount();
    const campaigns = [];

    for (let i = 0; i < campaignCount; i++) {
      const campaign = await contract.getCampaign(i);
      // Set createdAt based on the deadline (since contract doesn't have createdAt field)
      // Assuming default duration is 25 seconds based on the contract
      const createdAt = campaign.deadline ? Number(campaign.deadline) - 25 : undefined;
      
      campaigns.push({
        id: i,
        name: campaign.name,
        description: campaign.description,
        goal: campaign.goal,
        raised: campaign.raised,
        creator: campaign.creator,
        createdAt: createdAt,
        deadline: campaign.deadline,
        status: campaign.status
      });
    }

    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

// Get campaign by ID
export const getCampaignById = async (campaignId) => {
  try {
    const contract = await getContract();
    const campaign = await contract.getCampaign(campaignId);
    // Set createdAt based on the deadline (since contract doesn't have createdAt field)
    const createdAt = campaign.deadline ? Number(campaign.deadline) - 25 : undefined;
    
    return {
      id: campaignId,
      name: campaign.name,
      description: campaign.description,
      goal: campaign.goal,
      raised: campaign.raised,
      creator: campaign.creator,
      createdAt: createdAt,
      deadline: campaign.deadline,
      status: campaign.status
    };
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }
};

// Get campaign contributors
export const getCampaignContributors = async (campaignId) => {
  try {
    const contract = await getContract();
    const contributors = await contract.getCampaignContributors(campaignId);
    return contributors.map(contributor => ({
      address: contributor.contributor,
      amount: contributor.amount,
      timestamp: contributor.timestamp
    }));
  } catch (error) {
    console.error('Error fetching contributors:', error);
    throw error;
  }
};

// Get admin address
export const getAdminAddress = async () => {
  try {
    const contract = await getContract();
    return await contract.admin();
  } catch (error) {
    console.error('Error fetching admin address:', error);
    throw error;
  }
};

// Check if contract is paused
export const isContractPaused = async () => {
  try {
    const contract = await getContract();
    return await contract.paused();
  } catch (error) {
    console.error('Error checking contract pause status:', error);
    throw error;
  }
};

// Create new campaign
export const createCampaign = async (name, description, goal) => {
  try {
    const contract = await getContract();
    const goalInWei = ethers.parseEther(goal.toString());
    const tx = await contract.createCampaign(name, description, goalInWei);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Contribute to campaign
export const contributeToCampaign = async (campaignId, amount) => {
  try {
    const contract = await getContract();
    const amountInWei = ethers.parseEther(amount.toString());
    const tx = await contract.contribute(campaignId, { value: amountInWei });
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error contributing to campaign:', error);
    throw error;
  }
};

// Verify proof
export const verifyProof = async (campaignId) => {
  try {
    const contract = await getContract();
    const tx = await contract.verifyProof(campaignId);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error verifying proof:', error);
    throw error;
  }
};

export { getContract, CONTRACT_ADDRESS }; 