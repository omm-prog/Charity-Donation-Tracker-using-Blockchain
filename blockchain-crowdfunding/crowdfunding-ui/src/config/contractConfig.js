// Contract Configuration
import CrowdfundingContract from '../contracts/Crowdfunding.json';

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Mainnet address (if deployed)
  mainnet: "0x000D326D23a0cAaeaAd6e76F26aDC9A0D9648CE6",
  
  // Testnet address (if deployed)
  testnet: "0x000D326D23a0cAaeaAd6e76F26aDC9A0D9648CE6",
  
  // Local Ganache address - replace with your deployed contract address
  ganache: "0x000D326D23a0cAaeaAd6e76F26aDC9A0D9648CE6",
  
  // Default address (used when network is not specified)
  default: "0x000D326D23a0cAaeaAd6e76F26aDC9A0D9648CE6"
};

// Helper function to get contract address based on network
export const getContractAddress = (network) => {
  const address = CONTRACT_ADDRESSES[network] || CONTRACT_ADDRESSES.default;
  if (!address) {
    console.error(`No contract address found for network: ${network}`);
    return CONTRACT_ADDRESSES.default;
  }
  return address;
};

// Contract ABI
export const CONTRACT_ABI = CrowdfundingContract.abi;

// Export the entire contract artifact for completeness
export const CrowdfundingArtifact = CrowdfundingContract;

// Ganache URL
export const GANACHE_URL = "http://127.0.0.1:8546"; // Replace with your Ganache URL

// Admin email for admin panel access
export const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "admin@example.com";