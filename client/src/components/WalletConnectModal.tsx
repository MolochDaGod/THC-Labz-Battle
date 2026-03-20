import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Smartphone, Monitor, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  detectInstalledWallets,
  isMobile,
  isInAppBrowser,
  getAutoConnectProvider,
  type DetectedWallet,
} from '../utils/WalletDetector';

interface WalletConnectModalProps {
  onConnect: (walletAddress: string) => void;
  onClose: () => void;
}

const CURRENT_APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://thcclash.app';

export default function WalletConnectModal({ onConnect, onClose }: WalletConnectModalProps) {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onMobile, setOnMobile] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [tab, setTab] = useState<'wallet' | 'mobile'>('wallet');

  useEffect(() => {
    const mobile = isMobile();
    const app = isInAppBrowser();
    setOnMobile(mobile);
    setInApp(app);
    if (mobile && !app) setTab('mobile');

    const detected = detectInstalledWallets();
    setWallets(detected);

    // Auto-detect provider in-app browser (Phantom Browser, etc.)
    if (app) {
      const provider = getAutoConnectProvider();
      if (provider) {
        autoConnect(provider);
      }
    }
  }, []);

  const autoConnect = async (provider: any) => {
    try {
      const resp = await provider.connect({ onlyIfTrusted: true });
      const pk = resp?.publicKey ?? provider.publicKey;
      if (pk) onConnect(pk.toString());
    } catch {
      // Silent fail — user hasn't approved yet, they'll click the button
    }
  };

  const handleConnect = async (wallet: DetectedWallet) => {
    if (!wallet.installed) {
      window.open(wallet.installUrl, '_blank');
      return;
    }
    setConnecting(wallet.id);
    setError(null);
    try {
      const address = await wallet.connect();
      onConnect(address);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Connection cancelled — please approve in your wallet.');
      } else if (msg.includes('not available') || msg.includes('Cannot read')) {
        setError(`${wallet.name} is not available. Try refreshing the page.`);
      } else {
        setError(msg || `Failed to connect ${wallet.name}`);
      }
    } finally {
      setConnecting(null);
    }
  };

  const openDeepLink = (wallet: DetectedWallet) => {
    if (!wallet.deepLink) { window.open(wallet.installUrl, '_blank'); return; }
    window.location.href = wallet.deepLink(CURRENT_APP_URL);
  };

  const installedWallets = wallets.filter(w => w.installed);
  const notInstalledWallets = wallets.filter(w => !w.installed);
  const mobileWallets = wallets.filter(w => w.deepLink);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 100%)',
        border: '1px solid rgba(57,255,20,0.3)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        padding: '24px',
        boxShadow: '0 0 60px rgba(57,255,20,0.15)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '900',
              color: '#39ff14',
              fontFamily: "'LEMON MILK', sans-serif",
              letterSpacing: '1px',
            }}>CONNECT WALLET</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {onMobile ? 'Mobile — use deep link or scan QR' : 'Select your Solana wallet'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs: Desktop / Mobile */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px',
          padding: '4px',
        }}>
          {[
            { key: 'wallet', label: 'Browser', icon: Monitor },
            { key: 'mobile', label: 'Mobile App', icon: Smartphone },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: tab === key ? 'rgba(57,255,20,0.2)' : 'transparent',
                color: tab === key ? '#39ff14' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.3)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '16px',
          }}>
            <AlertCircle size={16} style={{ color: '#ff5050', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#ff9090' }}>{error}</span>
          </div>
        )}

        {/* ── Browser wallet tab ── */}
        {tab === 'wallet' && (
          <>
            {/* Installed wallets */}
            {installedWallets.length > 0 && (
              <>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '1px' }}>
                  DETECTED
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {installedWallets.map(wallet => (
                    <WalletRow
                      key={wallet.id}
                      wallet={wallet}
                      connecting={connecting === wallet.id}
                      badge="Installed"
                      badgeColor="#39ff14"
                      onClick={() => handleConnect(wallet)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Not installed wallets */}
            {notInstalledWallets.length > 0 && (
              <>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '1px' }}>
                  {installedWallets.length > 0 ? 'MORE WALLETS' : 'POPULAR WALLETS'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notInstalledWallets.map(wallet => (
                    <WalletRow
                      key={wallet.id}
                      wallet={wallet}
                      connecting={false}
                      badge="Install"
                      badgeColor="#fbbf24"
                      onClick={() => handleConnect(wallet)}
                    />
                  ))}
                </div>
              </>
            )}

            {installedWallets.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '13px',
                lineHeight: 1.6,
              }}>
                <p style={{ margin: '0 0 12px 0' }}>No wallet extension detected.</p>
                <p style={{ margin: 0 }}>Install one above, or switch to <b style={{ color: '#fff' }}>Mobile App</b> to use Phantom or Solflare on your phone.</p>
              </div>
            )}
          </>
        )}

        {/* ── Mobile wallet tab ── */}
        {tab === 'mobile' && (
          <>
            <div style={{
              background: 'rgba(57,255,20,0.06)',
              border: '1px solid rgba(57,255,20,0.15)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
            }}>
              <b style={{ color: '#39ff14' }}>Tap a wallet below</b> to open the THC CLASH site directly inside the mobile app — your wallet will be ready to connect.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mobileWallets.map(wallet => (
                <button
                  key={wallet.id}
                  onClick={() => openDeepLink(wallet)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: '#fff',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.4)'; e.currentTarget.style.background = 'rgba(57,255,20,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  <WalletIcon wallet={wallet} size={40} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>Open in {wallet.name}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      Opens {wallet.name} mobile app
                    </p>
                  </div>
                  <ExternalLink size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '1px' }}>
                DON'T HAVE A WALLET?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { name: 'Phantom', url: 'https://phantom.app', emoji: '👻', color: '#9945FF' },
                  { name: 'Solflare', url: 'https://solflare.com', emoji: '☀️', color: '#F77A18' },
                ].map(({ name, url, emoji, color }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{emoji}</span>
                    <span>Get {name}</span>
                    <ExternalLink size={12} style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }} />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer info */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={14} style={{ color: '#39ff14', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
            Your keys stay in your wallet. THC CLASH never stores your private key.
          </p>
        </div>
      </div>
    </div>
  );
}

function WalletIcon({ wallet, size = 36 }: { wallet: DetectedWallet; size?: number }) {
  const fallbackColors: Record<string, string> = {
    phantom: '#9945FF',
    solflare: '#F77A18',
    backpack: '#E33E3F',
    magiceden: '#E42575',
    coinbase: '#1652F0',
  };
  const [imgFailed, setImgFailed] = useState(false);
  return imgFailed ? (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.25,
      background: fallbackColors[wallet.id] || '#555',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: '900',
      color: '#fff',
      flexShrink: 0,
    }}>
      {wallet.name[0]}
    </div>
  ) : (
    <img
      src={wallet.icon}
      alt={wallet.name}
      onError={() => setImgFailed(true)}
      style={{ width: size, height: size, borderRadius: size * 0.25, objectFit: 'contain', flexShrink: 0 }}
    />
  );
}

function WalletRow({
  wallet, connecting, badge, badgeColor, onClick,
}: {
  wallet: DetectedWallet;
  connecting: boolean;
  badge: string;
  badgeColor: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={connecting}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 14px',
        background: hovered ? 'rgba(57,255,20,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(57,255,20,0.35)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        cursor: connecting ? 'wait' : 'pointer',
        color: '#fff',
        textAlign: 'left',
        transition: 'all 0.2s',
        width: '100%',
        opacity: connecting ? 0.7 : 1,
      }}
    >
      <WalletIcon wallet={wallet} size={38} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>{wallet.name}</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
          Solana Wallet
        </p>
      </div>
      {connecting ? (
        <RefreshCw size={16} style={{ color: '#39ff14', animation: 'spin360 1s linear infinite', flexShrink: 0 }} />
      ) : (
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          padding: '3px 8px',
          borderRadius: '6px',
          background: `${badgeColor}22`,
          color: badgeColor,
          border: `1px solid ${badgeColor}44`,
          flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
