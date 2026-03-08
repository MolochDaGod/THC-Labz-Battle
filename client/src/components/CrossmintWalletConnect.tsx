import React, { useState } from 'react';
import { Wallet, Mail, Phone, MessageSquare, LogOut, User, Loader, ChevronRight, CheckCircle, ExternalLink } from 'lucide-react';
import useCrossmint from '../hooks/useCrossmint';

interface CrossmintWalletConnectProps {
  onConnected?: (walletAddress: string, userId: string) => void;
  onDisconnected?: () => void;
  compact?: boolean;
}

type Step = 'menu' | 'email' | 'phone' | 'otp' | 'connected';

const CrossmintWalletConnect: React.FC<CrossmintWalletConnectProps> = ({
  onConnected,
  onDisconnected,
  compact = false,
}) => {
  const {
    isAuthenticated, isLoading, user, wallet, error,
    loginWithWallet, loginWithEmail, loginWithPhone, verifyOTP, loginWithDiscord, logout,
  } = useCrossmint();

  const [step, setStep] = useState<Step>('menu');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMethod, setOtpMethod] = useState<'email' | 'phone'>('email');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const walletAddress = wallet?.address ?? user?.walletAddress ?? user?.serverWallet ?? '';

  React.useEffect(() => {
    if (isAuthenticated && walletAddress) {
      onConnected?.(walletAddress, user?.userId ?? '');
    }
  }, [isAuthenticated, walletAddress]);

  const handleWalletLogin = async () => {
    setLocalLoading(true);
    setLocalError('');
    const addr = await loginWithWallet();
    setLocalLoading(false);
    if (!addr) setLocalError('Wallet login cancelled or failed.');
  };

  const handleEmailPhone = async (method: 'email' | 'phone') => {
    if (!identifier.trim()) { setLocalError('Please enter a valid ' + method); return; }
    setLocalLoading(true);
    setLocalError('');
    let sent = false;
    if (method === 'email') sent = await loginWithEmail(identifier.trim());
    else                     sent = await loginWithPhone(identifier.trim());
    setLocalLoading(false);
    if (sent) { setOtpSent(true); setOtpMethod(method); setStep('otp'); }
    else setLocalError('Failed to send code. Try again.');
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) { setLocalError('Enter the 6-digit code.'); return; }
    setLocalLoading(true);
    setLocalError('');
    const ok = await verifyOTP(identifier, otp.trim(), otpMethod);
    setLocalLoading(false);
    if (!ok) setLocalError('Invalid code. Check and try again.');
  };

  const handleLogout = () => {
    logout();
    setStep('menu');
    setIdentifier('');
    setOtp('');
    setOtpSent(false);
    onDisconnected?.();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  };
  const btnStyle = (color = '#16a34a'): React.CSSProperties => ({
    width: '100%', padding: '11px 16px', background: color,
    border: 'none', borderRadius: 10, color: '#fff',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'filter 0.15s',
  });

  if (isLoading || localLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, color: '#86efac' }}>
        <Loader className="animate-spin" size={20} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Connecting…</span>
      </div>
    );
  }

  if (isAuthenticated) {
    const display = user?.email ?? user?.phoneNumber ?? user?.discord?.username ?? walletAddress.slice(0, 8) + '…';
    return (
      <div style={{ padding: compact ? 8 : 16, background: 'rgba(22,163,74,0.12)', borderRadius: 12, border: '1.5px solid rgba(22,163,74,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: compact ? 0 : 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#86efac', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</div>
            {walletAddress && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </div>
            )}
          </div>
          <CheckCircle size={16} color="#22c55e" />
        </div>
        {!compact && (
          <button onClick={handleLogout} style={{ ...btnStyle('rgba(239,68,68,0.2)'), border: '1.5px solid #ef4444', color: '#fca5a5', marginTop: 8 }}>
            <LogOut size={14} /> Sign Out
          </button>
        )}
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 14, color: '#86efac', fontWeight: 700, marginBottom: 6 }}>Enter Verification Code</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
          We sent a 6-digit code to <b style={{ color: '#fff' }}>{identifier}</b>
        </div>
        <input
          style={inputStyle} type="text" inputMode="numeric" maxLength={6}
          placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
        />
        {(error || localError) && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{error || localError}</div>}
        <button style={{ ...btnStyle(), marginTop: 12 }} onClick={handleVerifyOTP}>
          <CheckCircle size={14} /> Verify Code
        </button>
        <button style={{ ...btnStyle('transparent'), border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12 }} onClick={() => { setStep('menu'); setOtp(''); setOtpSent(false); }}>
          Back
        </button>
      </div>
    );
  }

  if (step === 'email' || step === 'phone') {
    const isEmail = step === 'email';
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 14, color: '#86efac', fontWeight: 700, marginBottom: 12 }}>
          {isEmail ? 'Sign in with Email' : 'Sign in with Phone'}
        </div>
        <input
          style={inputStyle}
          type={isEmail ? 'email' : 'tel'}
          placeholder={isEmail ? 'you@example.com' : '+1 555 000 0000'}
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEmailPhone(step)}
        />
        {(error || localError) && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{error || localError}</div>}
        <button style={{ ...btnStyle(), marginTop: 12 }} onClick={() => handleEmailPhone(step)}>
          <ChevronRight size={14} /> Send Code
        </button>
        <button style={{ ...btnStyle('transparent'), border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12 }} onClick={() => { setStep('menu'); setIdentifier(''); setLocalError(''); }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.12)' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4, textAlign: 'center' }}>
        Connect to THC CLASH
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 16 }}>
        Sign in to save progress, earn BUDZ &amp; connect GROWERZ NFTs
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={btnStyle('#512da8')} onClick={handleWalletLogin}>
          <Wallet size={15} /> Solana Wallet (Phantom / Solflare)
        </button>
        <button style={btnStyle('#1565c0')} onClick={() => { setStep('email'); setLocalError(''); }}>
          <Mail size={15} /> Email
        </button>
        <button style={btnStyle('#00796b')} onClick={() => { setStep('phone'); setLocalError(''); }}>
          <Phone size={15} /> Phone / SMS
        </button>
        <button style={btnStyle('#4e4e8e')} onClick={loginWithDiscord}>
          <MessageSquare size={15} /> Discord
        </button>
      </div>

      {(error || localError) && (
        <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
          {error || localError}
        </div>
      )}
    </div>
  );
};

export default CrossmintWalletConnect;
export { CrossmintWalletConnect };
