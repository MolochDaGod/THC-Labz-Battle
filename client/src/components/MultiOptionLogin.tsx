import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import GameIcon from './GameIcon';
import { preloadIcons } from '../services/ImageService';
import WalletConnectModal from './WalletConnectModal';

interface MultiOptionLoginProps {
  onLoginComplete: (userData: any) => void;
  onBack?: () => void;
}

const inputClass =
  'w-full bg-black/60 border-2 border-white/20 focus:border-green-400 rounded-2xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none transition-colors text-lg';

const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 overflow-y-auto">
    <div className="max-w-sm w-full screen-enter">
      {children}
    </div>
  </div>
);

const borderMap: Record<string, string> = {
  green: 'cartoon-card-green',
  purple: 'cartoon-card-purple',
  blue: 'cartoon-card-blue',
  gold: 'cartoon-card-gold',
};

const Card = ({ children, color = 'green' }: { children: React.ReactNode; color?: string }) => (
  <div className={`cartoon-card ${borderMap[color] || ''} p-6 sm:p-8`}>
    {children}
  </div>
);

export default function MultiOptionLogin({ onLoginComplete, onBack }: MultiOptionLoginProps) {
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email' | 'web3' | 'discord' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handlePhoneLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) { toast.error('Please enter a valid phone number'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setShowVerification(true);
        toast.success('Verification code sent to your phone!');
      } else {
        toast.error(data.error || 'Failed to send code');
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setShowVerification(true);
        toast.success('Verification code sent to your email!');
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnected = async (walletAddress: string) => {
    setShowWalletModal(false);
    setIsLoading(true);
    try {
      let budzBalance = 0, gbuxBalance = 0, thcBalance = 0;
      try {
        const authRes = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });
        const authData = await authRes.json();
        if (authData.success && authData.user) {
          budzBalance = authData.user.budzBalance ?? 0;
          gbuxBalance = authData.user.gbuxBalance ?? 0;
          thcBalance = authData.user.thcBalance ?? 0;
        }
      } catch {}
      const userData = {
        id: `wallet_${walletAddress}`, walletAddress, loginMethod: 'web3',
        displayName: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
        isAuthenticated: true, budzBalance, gbuxBalance, thcBalance,
      };
      localStorage.setItem('thc-clash-user', JSON.stringify(userData));
      onLoginComplete(userData);
      toast.success('Wallet connected!');
    } catch {
      toast.error('Failed to authenticate wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const userData = {
        id: 'discord_user123', discordId: 'user123', loginMethod: 'discord',
        displayName: 'DiscordUser#1234', isAuthenticated: true,
      };
      localStorage.setItem('thc-clash-user', JSON.stringify(userData));
      onLoginComplete(userData);
      toast.success('Discord login successful!');
    } catch { toast.error('Discord login failed'); }
    finally { setIsLoading(false); }
  };

  const handleVerificationSubmit = async () => {
    if (!verificationCode || verificationCode.length < 6) { toast.error('Enter the 6-digit code'); return; }
    setIsLoading(true);
    try {
      const endpoint = loginMethod === 'phone' ? '/api/auth/phone' : '/api/auth/email';
      const body = loginMethod === 'phone'
        ? { phoneNumber, otp: verificationCode }
        : { email, otp: verificationCode };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success && data.user) {
        const userData = {
          id: data.user.userId,
          [loginMethod === 'phone' ? 'phoneNumber' : 'email']: loginMethod === 'phone' ? phoneNumber : email,
          loginMethod,
          displayName: loginMethod === 'phone' ? phoneNumber : email,
          isAuthenticated: true,
          verified: true,
          token: data.token,
        };
        localStorage.setItem('thc-clash-user', JSON.stringify(userData));
        onLoginComplete(userData);
        toast.success('Verified! Welcome!');
      } else {
        toast.error(data.error || 'Verification failed — check your code');
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    preloadIcons(['phone', 'email', 'phantom', 'discord', 'rocket', 'win', 'gift', 'shield']);
  }, []);

  const BackBtn = ({ label = 'Back' }: { label?: string }) => (
    <button
      onClick={() => { setLoginMethod(null); setShowVerification(false); setVerificationCode(''); }}
      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 min-h-[44px]"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );

  /* ── Main menu ─────────────────────────────────────────── */
  if (!loginMethod) {
    return (
      <Screen>
        <div className="text-center mb-8">
          <img
            src="/thc-labz-logo-nowords.png"
            alt="THC CLASH"
            className="w-28 h-28 mx-auto mb-3 float-bob drop-shadow-[0_0_28px_rgba(57,255,20,0.9)]"
          />
          <h1
            className="cartoon-title text-4xl mb-1"
            style={{ color: '#39ff14' }}
          >
            THC CLASH
          </h1>
          <p
            className="cartoon-title text-lg mb-2"
            style={{ color: '#ffe259' }}
          >
            DOPE BUDZ EDITION
          </p>
          <p className="text-gray-400 text-sm">Enter the dope zone — choose your login</p>
        </div>

        <Card color="green">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Back</span>
            </button>
          )}

          <div className="space-y-3">
            <button
              onClick={() => setLoginMethod('phone')}
              className="cartoon-btn cartoon-btn-blue w-full py-4 text-base"
            >
              <span className="flex items-center gap-3">
                <GameIcon icon="phone" size={28} />
                <span>Login with Phone</span>
              </span>
            </button>

            <button
              onClick={() => setLoginMethod('email')}
              className="cartoon-btn cartoon-btn-green w-full py-4 text-base"
            >
              <span className="flex items-center gap-3">
                <GameIcon icon="email" size={28} />
                <span>Login with Email</span>
              </span>
            </button>

            <button
              onClick={() => setShowWalletModal(true)}
              className="cartoon-btn cartoon-btn-purple w-full py-4 text-base"
            >
              <span className="flex items-center gap-3">
                <GameIcon icon="phantom" size={28} />
                <span>Connect Wallet</span>
                <span className="cartoon-badge text-purple-200 text-[10px] ml-auto" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
                  WEB3
                </span>
              </span>
            </button>

            <button
              onClick={() => setLoginMethod('discord')}
              className="cartoon-btn w-full py-4 text-base"
              style={{
                background: 'linear-gradient(180deg,#7289da,#4752c4)',
                boxShadow: '0 6px 0 #2c3880, 0 8px 20px rgba(88,101,242,0.5)',
                border: '3px solid rgba(0,0,0,0.8)',
                color: '#fff',
              }}
            >
              <span className="flex items-center gap-3">
                <GameIcon icon="discord" size={28} />
                <span>Login with Discord</span>
              </span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-gray-500 text-xs" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>
              Secure · NFT Integrated · Solana Web3
            </p>
          </div>
        </Card>
      </Screen>
    );
  }

  /* ── Wallet Connect Modal ───────────────────────────────────── */
  if (showWalletModal) {
    return (
      <WalletConnectModal
        onConnect={handleWalletConnected}
        onClose={() => setShowWalletModal(false)}
      />
    );
  }

  /* ── Wallet authenticating (post-connect) ─────────────────── */
  if (isLoading && loginMethod === null) {
    return (
      <Screen>
        <div className="text-center">
          <div className="float-bob mb-4" style={{ fontSize: '64px' }}>🌿</div>
          <h2 className="cartoon-title text-2xl text-green-400 mb-2">Connecting...</h2>
          <p className="text-gray-400 text-sm">Authenticating your wallet</p>
        </div>
      </Screen>
    );
  }

  /* ── Discord ───────────────────────────────────────────── */
  if (loginMethod === 'discord') {
    return (
      <Screen>
        <Card color="blue">
          <BackBtn label="Back to options" />
          <div className="text-center">
            <GameIcon icon="discord" size={80} className="mx-auto mb-4 float-bob" />
            <h2 className="cartoon-title text-2xl text-blue-300 mb-2">Discord Login</h2>
            <p className="text-gray-400 mb-6 text-sm">Join the THC CLASH community via Discord</p>
            <button
              onClick={handleDiscordLogin}
              disabled={isLoading}
              className="cartoon-btn w-full py-4 text-lg disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg,#7289da,#4752c4)',
                boxShadow: '0 6px 0 #2c3880, 0 8px 20px rgba(88,101,242,0.5)',
                border: '3px solid rgba(0,0,0,0.8)',
                color: '#fff',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <GameIcon icon="discord" size={24} />
                {isLoading ? 'Connecting...' : 'Continue with Discord'}
              </span>
            </button>
          </div>
        </Card>
      </Screen>
    );
  }

  /* ── Phone / Email ─────────────────────────────────────── */
  const isPhone = loginMethod === 'phone';
  return (
    <Screen>
      <Card color={isPhone ? 'blue' : 'green'}>
        <BackBtn label="Back to options" />
        <div className="text-center mb-6">
          <GameIcon icon={isPhone ? 'phone' : 'email'} size={72} className="mx-auto mb-3 float-bob" />
          <h2 className="cartoon-title text-2xl" style={{ color: isPhone ? '#4dabff' : '#39ff14' }}>
            {isPhone ? 'Phone Login' : 'Email Login'}
          </h2>
        </div>

        {!showVerification ? (
          <div className="space-y-4">
            <label className="cartoon-label text-gray-300 text-xs block mb-1">
              {isPhone ? 'Phone Number' : 'Email Address'}
            </label>
            <input
              type={isPhone ? 'tel' : 'email'}
              value={isPhone ? phoneNumber : email}
              onChange={e => isPhone ? setPhoneNumber(e.target.value) : setEmail(e.target.value)}
              placeholder={isPhone ? '+1 (555) 420-6969' : 'dope@example.com'}
              className={inputClass}
              autoComplete={isPhone ? 'tel' : 'email'}
              autoFocus
            />
            <button
              onClick={isPhone ? handlePhoneLogin : handleEmailLogin}
              disabled={isLoading}
              className={`cartoon-btn w-full py-4 text-lg disabled:opacity-50 ${isPhone ? 'cartoon-btn-blue' : 'cartoon-btn-green'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <GameIcon icon="rocket" size={24} />
                {isLoading ? 'Sending...' : `Send ${isPhone ? 'Code' : 'Link'}`}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm text-center mb-2">
              Enter the 6-digit code sent to<br />
              <span className="text-white font-semibold">{isPhone ? phoneNumber : email}</span>
            </p>
            <label className="cartoon-label text-gray-300 text-xs block mb-1">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className={`${inputClass} text-center text-3xl tracking-[0.5em]`}
              autoFocus
              autoComplete="one-time-code"
            />
            <button
              onClick={handleVerificationSubmit}
              disabled={isLoading}
              className="cartoon-btn cartoon-btn-green w-full py-4 text-lg disabled:opacity-50 pulse-green"
            >
              <span className="flex items-center justify-center gap-2">
                <GameIcon icon="win" size={24} />
                {isLoading ? 'Verifying...' : 'Verify & Enter!'}
              </span>
            </button>
            <button
              onClick={() => { setShowVerification(false); setVerificationCode(''); }}
              className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors mt-1"
            >
              Resend code
            </button>
          </div>
        )}
      </Card>
    </Screen>
  );
}
