import { Suspense, useState, useEffect } from "react";
import "@fontsource/inter";
import CannabisBackground from "./components/CannabisBackground";
import GrowerzCollection from "./components/GrowerzCollection";
import DownloadPage from "./components/DownloadPage";
import ResponsiveLayout from "./components/ResponsiveLayout";
import SettingsPage from "./components/SettingsPage";
import { UserProfileAuth } from "./components/UserProfileAuth";
import AdminGameBoard from "./components/AdminGameBoard";
import MultiOptionLogin from "./components/MultiOptionLogin";
import GameHub from "./components/GameHub";
import TeamBuilder from "./components/TeamBuilder";
import PreBattle from "./components/PreBattle";
import BattleResults from "./components/BattleResults";
import BattleHistory from "./components/BattleHistory";
import AuthenticTHCClashBattle from "./components/AuthenticTHCClashBattle";
import CardPackShop from "./components/CardPackShop";
import AccountPage from "./components/AccountPage";
import NFTTradePage from "./components/NFTTradePage";
import LibraryPage from "./components/LibraryPage";
import BudzPaySheet from "./components/BudzPaySheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { convertNFTsToUnitCards, type GrowerzUnitCard } from "./utils/GrowerzUnitSystem";
import { extractSSOToken, verifySSOToken, listenForSSOMessages, notifyParentReady, isEmbedded } from "./utils/MobileBridge";

const queryClient = new QueryClient();

function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('Loading THC CLASH...');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const messages = [
      'Loading THC CLASH...',
      'Connecting to Solana...',
      'Initializing game systems...',
      'Loading battle cards...',
      'Preparing the battlefield...'
    ];
    
    let index = 0;
    const msgInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 800);

    let p = 0;
    const progInterval = setInterval(() => {
      p = Math.min(p + Math.random() * 18, 95);
      setProgress(p);
    }, 160);
    
    return () => { clearInterval(msgInterval); clearInterval(progInterval); };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      background: 'linear-gradient(160deg, #050f08 0%, #0a1a10 40%, #061a14 70%, #020a06 100%)',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'white',
      fontFamily: "'LEMON MILK', 'Arial Black', sans-serif",
      zIndex: 9999,
      gap: '0',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(57,255,20,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <img
        src="/thc-labz-logo-nowords.png"
        alt="THC CLASH"
        style={{
          width: 130,
          height: 130,
          objectFit: 'contain',
          marginBottom: '1.2rem',
          filter: 'drop-shadow(0 0 28px rgba(57,255,20,0.8)) drop-shadow(0 0 8px rgba(57,255,20,0.5))',
          animation: 'floatBob 3s ease-in-out infinite',
        }}
      />
      <div style={{
        background: 'linear-gradient(90deg, #39ff14, #00e64d, #39ff14)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '2.8rem',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textAlign: 'center',
        animation: 'shimmer 2.5s linear infinite',
        textShadow: 'none',
        marginBottom: '0.3rem',
      }}>
        THC CLASH
      </div>
      <div style={{
        color: '#ffe259',
        fontSize: '0.8rem',
        letterSpacing: '0.2em',
        marginBottom: '2.5rem',
        opacity: 0.9,
        textTransform: 'uppercase',
      }}>
        DOPE BUDZ EDITION
      </div>
      <div style={{
        width: '280px',
        marginBottom: '0.9rem',
        background: 'rgba(255,255,255,0.07)',
        borderRadius: '99px',
        border: '2px solid rgba(57,255,20,0.25)',
        height: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #39ff14, #00e64d)',
          borderRadius: '99px',
          boxShadow: '0 0 12px rgba(57,255,20,0.7)',
          transition: 'width 0.15s ease-out',
        }} />
      </div>
      <div style={{ fontSize: '0.7rem', opacity: 0.55, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
        {loadingText}
      </div>
      <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 12, alignItems: 'center', opacity: 0.4 }}>
        <img src="/gbux-token.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>THC LABZ</span>
        <img src="/budz-token.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
      </div>
    </div>
  );
}

type GameScreen = 'login' | 'hub' | 'team-builder' | 'pre-battle' | 'battle' | 'results' | 'settings' | 'admin' | 'collection' | 'download' | 'profile' | 'history' | 'shop' | 'account' | 'trade' | 'library';

function App() {
  const [appReady, setAppReady] = useState(false);
  const [screen, setScreen] = useState<GameScreen>('login');
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('thc-clash-user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [connectedNFTs, setConnectedNFTs] = useState<any[]>(() => {
    try {
      const savedNFTs = localStorage.getItem('thc-clash-connected-nfts');
      return savedNFTs ? JSON.parse(savedNFTs) : [];
    } catch {
      return [];
    }
  });
  const [growerzUnitCards, setGrowerzUnitCards] = useState<GrowerzUnitCard[]>([]);

  const [battleDeck, setBattleDeck] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-battle-deck');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [teamName, setTeamName] = useState(() => {
    return localStorage.getItem('thc-clash-team-name') || 'THC Warriors';
  });
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [battleResult, setBattleResult] = useState<{ winner: 'player' | 'ai'; results: any } | null>(null);
  const [gameZones, setGameZones] = useState<any[]>([]);

  // Fetch real-time token balances from wallet
  useEffect(() => {
    if (!user?.walletAddress) return;
    const wallet = user.walletAddress;

    // Fetch on-chain THC LABZ balance
    fetch(`/api/wallet/${wallet}`)
      .then(r => r.json())
      .then(data => {
        if (data.walletAddress || data.gameTokenBalance !== undefined) {
          setUser((prev: any) => {
            const updated = { ...prev, gameTokenBalance: data.gameTokenBalance ?? prev.gameTokenBalance ?? 0 };
            localStorage.setItem('thc-clash-user', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});

    // Fetch DB-tracked BUDZ and GBUX balances
    fetch('/api/auth/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: wallet }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setUser((prev: any) => {
            const updated = {
              ...prev,
              budzBalance: data.user.budzBalance ?? prev.budzBalance ?? 0,
              gbuxBalance: data.user.gbuxBalance ?? prev.gbuxBalance ?? 0,
              thcBalance: data.user.thcBalance ?? prev.thcBalance ?? 0,
            };
            localStorage.setItem('thc-clash-user', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [user?.walletAddress]);

  // Auto-scan wallet for GROWERZ NFTs whenever user logs in
  useEffect(() => {
    if (!user?.walletAddress) return;
    const wallet = user.walletAddress;
    const cacheKey = `thc-clash-growerz-units-v2-${wallet}`;
    // Use cached data immediately while fetching fresh
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setGrowerzUnitCards(JSON.parse(cached));
    } catch (_e) {}

    fetch(`/api/my-nfts/${wallet}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.nfts?.length > 0) {
          const cards = convertNFTsToUnitCards(data.nfts);
          setGrowerzUnitCards(cards);
          setConnectedNFTs(data.nfts);
          localStorage.setItem(cacheKey, JSON.stringify(cards));
          localStorage.setItem('thc-clash-connected-nfts', JSON.stringify(data.nfts));
        }
      })
      .catch(() => {});
  }, [user?.walletAddress]);

  // SSO auto-login from Dope-Budz (URL param or postMessage)
  useEffect(() => {
    const attemptSSO = async (token: string) => {
      const result = await verifySSOToken(token);
      if (result.success && result.user) {
        const userData = {
          id: result.user.id,
          username: result.user.displayName,
          walletAddress: result.user.walletAddress,
          gbuxBalance: result.user.gbuxBalance ?? 0,
          budzBalance: result.user.budzBalance ?? 0,
          loginMethod: 'sso',
        };
        setUser(userData);
        localStorage.setItem('thc-clash-user', JSON.stringify(userData));
        setScreen('hub');
      }
    };

    // Path 1: ?sso= URL param
    const ssoToken = extractSSOToken();
    if (ssoToken) attemptSSO(ssoToken);

    // Path 2: postMessage from parent iframe
    const cleanup = listenForSSOMessages((token) => attemptSSO(token));
    notifyParentReady();

    return cleanup;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 1000);
    
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') setScreen('admin');
      else if (path === '/settings') setScreen('settings');
      else if (path === '/collection') setScreen('collection');
      else if (path === '/download') setScreen('download');
      else if (path === '/profile') setScreen('profile');
      else if (user) setScreen('hub');
      else setScreen('login');
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  useEffect(() => {
    if (appReady) {
      const path = window.location.pathname;
      if (path === '/admin') { setScreen('admin'); return; }
      if (path === '/download') { setScreen('download'); return; }
      if (path === '/collection') { setScreen('collection'); return; }
      if (path === '/settings') { setScreen('settings'); return; }
      if (path === '/profile') { setScreen('profile'); return; }
      if (user) setScreen('hub');
      else setScreen('login');
    }
  }, [appReady, user]);

  const navigateTo = (s: GameScreen) => {
    setScreen(s);
    const pathMap: Record<string, string> = {
      'hub': '/', 'login': '/', 'team-builder': '/build', 'pre-battle': '/prepare',
      'battle': '/battle', 'results': '/results', 'settings': '/settings',
      'admin': '/admin', 'collection': '/collection', 'download': '/download', 'profile': '/profile',
      'history': '/history', 'shop': '/shop', 'account': '/account', 'trade': '/trade', 'library': '/library'
    };
    window.history.pushState({}, '', pathMap[s] || '/');
  };

  const handleLoginComplete = (userData: any) => {
    setUser(userData);
    localStorage.setItem('thc-clash-user', JSON.stringify(userData));
    navigateTo('hub');
  };

  const handleLogout = () => {
    setUser(null);
    setConnectedNFTs([]);
    setGrowerzUnitCards([]);
    localStorage.removeItem('thc-clash-user');
    localStorage.removeItem('thc-clash-connected-nfts');
    if (user?.walletAddress) {
      localStorage.removeItem(`thc-clash-growerz-units-${user.walletAddress}`);
      localStorage.removeItem(`thc-clash-growerz-units-v2-${user.walletAddress}`);
    }
    localStorage.removeItem('thc-clash-wallet');
    localStorage.removeItem('thc-clash-connected-nft');
    localStorage.removeItem('thc-clash-player-nft');
    localStorage.removeItem('thc-clash-nft-bonuses');
    localStorage.removeItem('thc-clash-nft-benefits');
    localStorage.removeItem('thc-clash-enhanced-deck');
    localStorage.removeItem('thc-clash-captain-card');
    localStorage.removeItem('thc-clash-battle-cards');
    navigateTo('login');
  };

  const handleTeamBuilt = (deck: any[], name: string) => {
    setBattleDeck(deck);
    setTeamName(name);
    navigateTo('pre-battle');
  };

  const handleStartBattle = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setBattleResult(null);
    navigateTo('battle');
  };

  const handleBattleEnd = (winner: 'player' | 'ai', results: any) => {
    setBattleResult({ winner, results });
    navigateTo('results');
  };

  const handleGameBoardSave = (zones: any) => {
    setGameZones(zones);
    localStorage.setItem('thc_game_zones', JSON.stringify(zones));
  };

  const handleSyncToGame = (zones: any) => {
    setGameZones(zones);
  };

  if (!appReady) return <LoadingScreen />;

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return (
          <MultiOptionLogin
            onLoginComplete={handleLoginComplete}
            onBack={() => {}}
          />
        );

      case 'hub':
        return (
          <GameHub
            user={user}
            growerzUnitCards={growerzUnitCards}
            onPlayPvE={() => {
              try {
                const saved = localStorage.getItem('thc-clash-battle-deck');
                const deck = saved ? JSON.parse(saved) : [];
                const name = localStorage.getItem('thc-clash-team-name') || 'THC Warriors';
                if (deck.length >= 4) {
                  setBattleDeck(deck);
                  setTeamName(name);
                  navigateTo('pre-battle');
                } else {
                  navigateTo('team-builder');
                }
              } catch {
                navigateTo('team-builder');
              }
            }}
            onBuildTeam={() => navigateTo('team-builder')}
            onSettings={() => navigateTo('settings')}
            onLogout={handleLogout}
            onLibrary={() => navigateTo('library')}
            onHistory={() => navigateTo('history')}
            onShop={() => navigateTo('shop')}
            onAccount={() => navigateTo('account')}
            onTrade={() => navigateTo('trade')}
            onPaySheet={() => navigateTo('pay-sheet')}
          />
        );

      case 'team-builder':
        return (
          <TeamBuilder
            walletAddress={user?.walletAddress}
            growerzUnitCards={growerzUnitCards}
            onBack={() => navigateTo('hub')}
            onContinue={handleTeamBuilt}
          />
        );

      case 'pre-battle':
        return (
          <PreBattle
            deck={battleDeck}
            teamName={teamName}
            onBack={() => navigateTo('team-builder')}
            onStartBattle={handleStartBattle}
          />
        );

      case 'battle':
        return (
          <AuthenticTHCClashBattle
            playerDeck={battleDeck}
            difficulty={difficulty}
            gameZones={gameZones}
            onBattleEnd={handleBattleEnd}
            onBack={() => navigateTo('hub')}
            playerWallet={user?.walletAddress}
          />
        );

      case 'results':
        return battleResult ? (
          <BattleResults
            winner={battleResult.winner}
            results={battleResult.results}
            teamName={teamName}
            difficulty={difficulty}
            walletAddress={user?.walletAddress}
            onBalanceUpdate={(newBudzBalance: number) => {
              setUser((prev: any) => {
                const updated = { ...prev, budzBalance: newBudzBalance };
                localStorage.setItem('thc-clash-user', JSON.stringify(updated));
                return updated;
              });
            }}
            onPlayAgain={() => {
              setBattleResult(null);
              navigateTo('battle');
            }}
            onGoHome={() => navigateTo('hub')}
            onEditDeck={() => navigateTo('team-builder')}
            onHistory={() => navigateTo('history')}
          />
        ) : (
          <GameHub
            user={user}
            growerzUnitCards={growerzUnitCards}
            onPlayPvE={() => navigateTo('pre-battle')}
            onBuildTeam={() => navigateTo('team-builder')}
            onSettings={() => navigateTo('settings')}
            onLogout={handleLogout}
            onLibrary={() => navigateTo('library')}
            onHistory={() => navigateTo('history')}
            onShop={() => navigateTo('shop')}
            onAccount={() => navigateTo('account')}
            onPaySheet={() => navigateTo('pay-sheet')}
          />
        );

      case 'settings':
        return <SettingsPage onBack={() => navigateTo('hub')} />;

      case 'admin':
        return (
          <AdminGameBoard
            onBack={() => navigateTo('hub')}
            onSave={handleGameBoardSave}
            onSyncToGame={handleSyncToGame}
          />
        );

      case 'history':
        return <BattleHistory onBack={() => navigateTo('hub')} />;

      case 'shop':
        return (
          <CardPackShop
            walletAddress={user?.walletAddress}
            user={user}
            onBack={() => navigateTo('hub')}
          />
        );

      case 'account':
        return (
          <AccountPage
            user={user || {}}
            onBack={() => navigateTo('hub')}
            navigateTo={(s: string) => navigateTo(s as GameScreen)}
            connectedNFTs={connectedNFTs}
            onUserUpdate={(updated) => {
              setUser((prev: any) => {
                const merged = { ...prev, ...updated };
                localStorage.setItem('thc-clash-user', JSON.stringify(merged));
                return merged;
              });
            }}
          />
        );

      case 'library':
        return <LibraryPage onBack={() => navigateTo('hub')} walletAddress={user?.walletAddress} />;

      case 'collection':
        return <GrowerzCollection />;

      case 'download':
        return <DownloadPage />;

      case 'trade':
        return (
          <NFTTradePage
            walletAddress={user?.walletAddress}
            onBack={() => navigateTo('hub')}
          />
        );

      case 'profile':
        return (
          <UserProfileAuth
            onAuthChange={(authState: any) => {
              setUser(authState.user);
              if (authState.user) {
                localStorage.setItem('thc-clash-user', JSON.stringify(authState.user));
              }
            }}
            onNavigateHome={() => navigateTo('hub')}
            onNavigateToGame={() => navigateTo('hub')}
            connectedNFTs={connectedNFTs}
          />
        );

      case 'pay-sheet':
        return <BudzPaySheet onBack={() => navigateTo('hub')} />;

      default:
        return user ? (
          <GameHub
            user={user}
            growerzUnitCards={growerzUnitCards}
            onPlayPvE={() => navigateTo('pre-battle')}
            onBuildTeam={() => navigateTo('team-builder')}
            onSettings={() => navigateTo('settings')}
            onLogout={handleLogout}
            onLibrary={() => navigateTo('library')}
            onHistory={() => navigateTo('history')}
            onShop={() => navigateTo('shop')}
            onAccount={() => navigateTo('account')}
            onPaySheet={() => navigateTo('pay-sheet')}
          />
        ) : (
          <MultiOptionLogin
            onLoginComplete={handleLoginComplete}
            onBack={() => {}}
          />
        );
    }
  };

  const showBackground = screen !== 'battle';

  return (
    <QueryClientProvider client={queryClient}>
      {showBackground && <CannabisBackground />}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Suspense fallback={<LoadingScreen />}>
          {renderScreen()}
        </Suspense>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
