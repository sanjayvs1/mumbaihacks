import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface WalletError {
  code?: number;
  message: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (args: any) => void) => void;
      removeListener: (event: string, callback: (args: any) => void) => void;
    };
  }
}

const Web3Login = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const getErrorMessage = (err: unknown): string => {
    if (!err) return 'An unknown error occurred';

    if (typeof err === 'object' && err !== null) {
      const error = err as WalletError;

      switch (error.code) {
        case 4001:
          return 'Connection rejected. Please approve the connection request in your wallet.';
        case -32002:
          return 'A connection request is already pending in your wallet.';
        case -32603:
          return 'MetaMask is locked - please unlock your wallet.';
        default:
          return error.message || 'An error occurred. Please try again.';
      }
    }
    return 'Failed to connect wallet. Please try again.';
  };

  const connectWallet = async () => {
    if (isConnecting) return;

    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        showToast('Successfully connected to your wallet');
        navigate('/meetings'); // Navigate to meetings page after successful connection
      } else {
        throw new Error('No accounts found.');
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
      showToast('Your wallet has been disconnected');
    } else {
      setAddress(accounts[0]);
      showToast('Wallet account has been changed');
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const handleDisconnect = () => {
    setAddress('');
    setError('');
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
    showToast('Wallet disconnected');
  };

  const formatAddress = (addr: string): string =>
    addr.length > 10 ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : addr;

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (err) {
        console.error('Failed to check wallet connection:', err);
      }
    };

    checkIfWalletIsConnected();
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
    
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 font-sans text-gray-800">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-bold text-blue-800 mb-6">Welcome to MeetHub!</h2>
        
        <div className="flex justify-center items-center mb-6 space-x-4">
          {!address ? (
            <button
              className={`px-6 py-3 text-white font-semibold bg-blue-700 rounded-full shadow-md hover:bg-blue-800 transition duration-200 ${isConnecting ? 'loading' : ''}`}
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <button
              className="px-6 py-3 font-semibold bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition duration-200"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </button>
          )}
        </div>

        {address && (
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
            <p className="text-lg">
              Connected Address: <span className="font-mono">{formatAddress(address)}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 mt-4 bg-red-100 text-red-600 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {toastMessage && (
          <div className="p-4 mt-4 bg-green-100 text-green-600 rounded-md">
            <p>{toastMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Web3Login;
