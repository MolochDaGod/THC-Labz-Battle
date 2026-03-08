import { useState, useEffect } from 'react';

// Simple working THC Dope Budz game interface
export default function SimpleApp() {
  const [gameState, setGameState] = useState({
    money: 2000,
    health: 100,
    day: 1,
    debt: 5500,
    city: 'New York'
  });
  
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [balances, setBalances] = useState({
    budz: 0,
    gbux: 0,
    thcLabz: 0,
    sol: 0
  });

  // Auto-connect wallet on load
  useEffect(() => {
    const detectWallet = async () => {
      if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
        try {
          const response = await (window as any).solana.connect({ onlyIfTrusted: true });
          if (response.publicKey) {
            const walletAddress = response.publicKey.toString();
            setConnectedWallet(walletAddress);
            console.log('✅ Wallet connected:', walletAddress);
            
            // Fetch balances
            try {
              const balanceResponse = await fetch(`/api/wallet/${walletAddress}`);
              if (balanceResponse.ok) {
                const data = await balanceResponse.json();
                setBalances({
                  budz: data.budzBalance || 0,
                  gbux: data.gbuxBalance || 0,
                  thcLabz: data.thcLabzTokenBalance || 0,
                  sol: data.solBalance || 0
                });
              }
            } catch (error) {
              console.error('Error fetching balances:', error);
            }
          }
        } catch (error) {
          console.log('Wallet not auto-connected');
        }
      }
    };
    
    detectWallet();
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
      try {
        const response = await (window as any).solana.connect();
        const walletAddress = response.publicKey.toString();
        setConnectedWallet(walletAddress);
        console.log('✅ Wallet connected:', walletAddress);
      } catch (error) {
        console.error('Wallet connection failed:', error);
      }
    } else {
      alert('Please install Phantom wallet to play');
    }
  };

  const buyDrug = (drug: string, price: number, amount: number) => {
    const cost = price * amount;
    if (gameState.money >= cost) {
      setGameState(prev => ({
        ...prev,
        money: prev.money - cost
      }));
      alert(`Bought ${amount} ${drug} for $${cost}`);
    } else {
      alert('Not enough money!');
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d4f3c 100%)',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          background: 'linear-gradient(45deg, #00ff88, #00cc66)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          THC DOPE BUDZ
        </h1>
        <p style={{ opacity: 0.8 }}>Cannabis Trading Empire on Solana</p>
      </div>

      {/* Game Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ff88' }}>
            ${gameState.money.toLocaleString()}
          </div>
          <div style={{ opacity: 0.7 }}>Money</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4444' }}>
            ${gameState.debt.toLocaleString()}
          </div>
          <div style={{ opacity: 0.7 }}>Debt</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4488ff' }}>
            {gameState.health}%
          </div>
          <div style={{ opacity: 0.7 }}>Health</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffaa00' }}>
            Day {gameState.day}
          </div>
          <div style={{ opacity: 0.7 }}>{gameState.city}</div>
        </div>
      </div>

      {/* Wallet Section */}
      <div style={{
        background: 'rgba(0, 255, 136, 0.1)',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '30px',
        border: '2px solid rgba(0, 255, 136, 0.3)'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#00ff88' }}>Web3 Wallet</h3>
        {connectedWallet ? (
          <div>
            <p style={{ marginBottom: '10px' }}>
              Connected: {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-8)}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{balances.budz.toLocaleString()}</div>
                <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>BUDZ</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{balances.gbux.toLocaleString()}</div>
                <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>GBUX</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{balances.thcLabz.toLocaleString()}</div>
                <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>THC LABZ</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{balances.sol.toFixed(3)}</div>
                <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>SOL</div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            style={{
              background: 'linear-gradient(45deg, #00ff88, #00cc66)',
              color: '#000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Connect Phantom Wallet
          </button>
        )}
      </div>

      {/* Market */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '20px',
        borderRadius: '15px'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Street Market - {gameState.city}</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          {[
            { name: 'OG Kush', price: 800, emoji: '🌿' },
            { name: 'Sour Diesel', price: 1200, emoji: '⚡' },
            { name: 'Purple Haze', price: 950, emoji: '💜' },
            { name: 'White Widow', price: 1100, emoji: '❄️' }
          ].map((drug) => (
            <div key={drug.name} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '15px',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{drug.emoji}</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{drug.name}</div>
                  <div style={{ color: '#00ff88' }}>${drug.price}/gram</div>
                </div>
              </div>
              <button
                onClick={() => buyDrug(drug.name, drug.price, 1)}
                style={{
                  background: 'rgba(0, 255, 136, 0.2)',
                  color: '#00ff88',
                  border: '1px solid #00ff88',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Buy 1 gram
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '30px',
        opacity: 0.7,
        fontSize: '0.9rem'
      }}>
        <p>Real Solana integration • 50 achievements • BUDZ token rewards</p>
        <p>Build your cannabis empire and earn cryptocurrency!</p>
      </div>
    </div>
  );
}