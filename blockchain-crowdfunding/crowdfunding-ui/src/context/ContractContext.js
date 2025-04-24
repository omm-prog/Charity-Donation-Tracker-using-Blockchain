import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/contractConfig';
import CrowdfundingArtifact from '../contracts/Crowdfunding.json';

const ContractContext = createContext();

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};

export const ContractProvider = ({ children }) => {
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState('default');
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const initializeContract = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Check if we have the contract ABI
      if (!CrowdfundingArtifact || !CrowdfundingArtifact.abi) {
        throw new Error('Contract ABI not found');
      }

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }
      setCurrentAccount(accounts[0]);
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get network to ensure we're on the right chain
      const networkData = await provider.getNetwork();
      console.log('Connected to network:', networkData);
      
      // Determine which network we're on
      let currentNetwork = 'default';
      if (networkData.chainId === 1337n) {
        currentNetwork = 'ganache';
      } else if (networkData.chainId === 1n) {
        currentNetwork = 'mainnet';
      } else if (networkData.chainId === 5n) {
        currentNetwork = 'testnet';
      } else {
        console.log('Using default network configuration');
      }
      setNetwork(currentNetwork);
      
      // Get contract address
      const contractAddress = getContractAddress(currentNetwork);
      if (!contractAddress) {
        throw new Error(`No contract address found for network: ${currentNetwork}`);
      }

      console.log('Contract Address:', contractAddress);
      console.log('Contract ABI available:', !!CrowdfundingArtifact.abi);

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        CrowdfundingArtifact.abi,
        signer
      );

      // Debug contract instance
      if (!contract) {
        throw new Error('Failed to create contract instance');
      }

      console.log('Contract instance created');
      console.log('Contract interface:', contract.interface ? 'Available' : 'Not available');
      
      // Verify contract connection
      try {
        const admin = await contract.admin();
        console.log('Contract connection verified, admin:', admin);
      } catch (err) {
        console.error('Contract connection error:', err);
        throw new Error('Failed to connect to the smart contract. Please check your network connection.');
      }
      
      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setRetryCount(0);
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError(err.message);
      
      // Implement retry mechanism
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          initializeContract();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsInitializing(false);
    }
  }, [retryCount]);

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setCurrentAccount(null);
        setContract(null);
        setError('Please connect your wallet to continue.');
      } else if (accounts[0] !== currentAccount) {
        setCurrentAccount(accounts[0]);
        initializeContract();
      }
    };

    const handleChainChanged = () => {
      setContract(null);
      setError('Network changed. Please wait while we reconnect...');
      initializeContract();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [currentAccount, initializeContract]);

  // Initial contract setup
  useEffect(() => {
    initializeContract();
  }, [initializeContract]);

  const value = {
    contract,
    provider,
    signer,
    error,
    network,
    isInitializing,
    currentAccount,
    refreshContract: initializeContract
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export default ContractContext; 