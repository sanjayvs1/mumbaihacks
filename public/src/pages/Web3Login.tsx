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

  // Effect to check if the user is already connected on mount
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
    
    // Cleanup listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
    
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-center text-2xl font-bold mb-4">Welcome to MeetHub!</h2>
      
      <div className="flex justify-center space-x-4 mb-4">
        {!address ? (
          <button
            className={`btn btn-primary btn-sm ${isConnecting ? 'loading' : ''}`}
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </button>
            <button
              className={`btn btn-primary btn-sm`}
              onClick={connectWallet}
            >
              Connect Again
            </button>
          </>
        )}
      </div>

      {address && (
        <div className="p-4 border border-gray-300 rounded-lg">
          <p className="text-lg">
            Connected Address: <span className="font-mono">{formatAddress(address)}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-4">
          <p>{error}</p>
        </div>
      )}

      {toastMessage && (
        <div className="toast toast-success mt-4">
          <div>{toastMessage}</div>
        </div>
      )}
    </div>
  );
};

export default Web3Login;