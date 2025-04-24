import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CurrencyContext = createContext();
const FLASH_FEE_PERCENTAGE = 1.5;

// Initialize currency definitions
export const currencies = {
  INR: {
    symbol: '₹',
    name: 'INR',
    rate: null
  },
  USDT: {
    symbol: '$',
    name: 'USDT',
    rate: null
  },
  ETH: {
    symbol: 'Ξ',
    name: 'ETH',
    rate: 1  // ETH is base
  }
};

export function CurrencyProvider({ children }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currencies.USDT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRates = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr'
      );

      if (!response.ok) throw new Error('Failed to fetch from CoinGecko');

      const data = await response.json();
      const ethUsdRate = data.ethereum.usd;
      const ethInrRate = data.ethereum.inr;

      // Set rates
      currencies.USDT.rate = ethUsdRate;
      currencies.INR.rate = ethInrRate;

      console.log('✅ Updated Rates:', {
        ETH: 1,
        USDT: ethUsdRate,
        INR: ethInrRate,
        updated: new Date().toLocaleTimeString()
      });

      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('❌ Rate Fetch Error:', err);
      setError('Could not fetch currency rates');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const calculateFlashFee = (amount) => {
    return (amount * FLASH_FEE_PERCENTAGE) / 100;
  };

  const convertAmount = (amount, fromCurrency = 'ETH', includeFee = false) => {
    if (loading || error) return amount;

    const from = currencies[fromCurrency];
    const to = selectedCurrency;

    if (!from || !to || from.rate === null || to.rate === null) {
      console.error('Missing rate:', { from, to });
      return amount;
    }

    let result;
    try {
      if (fromCurrency === 'ETH') {
        result = amount * to.rate;
      } else if (to.name === 'ETH') {
        result = amount / from.rate;
      } else {
        const ethAmount = amount / from.rate;
        result = ethAmount * to.rate;
      }

      if (includeFee) {
        result += calculateFlashFee(result);
      }

      return result.toFixed(to.name === 'ETH' ? 6 : 2);
    } catch (err) {
      console.error('Conversion Error:', err);
      return amount;
    }
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setSelectedCurrency,
      currencies,
      convertAmount,
      calculateFlashFee,
      loading,
      error,
      refreshRates: fetchRates,
      FLASH_FEE_PERCENTAGE
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
