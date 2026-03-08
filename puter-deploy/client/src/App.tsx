import { Suspense, useState, useEffect } from "react";
import "@fontsource/inter";
import DopeWarsGame from "./components/DopeWarsGame";
import DownloadPage from "./components/DownloadPage";
import ResponsiveLayout from "./components/ResponsiveLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient();

function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('Loading THC Dope Budz...');
  
  useEffect(() => {
    const messages = [
      'Loading THC Dope Budz...',
      'Connecting to Solana blockchain...',
      'Initializing game systems...',
      'Loading achievements...',
      'Starting your cannabis empire...'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d4f3c 100%)', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(45deg, #00ff88, #00cc66)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '3rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        THC DOPE BUDZ
      </div>
      <div style={{
        fontSize: '1.2rem',
        marginBottom: '2rem',
        opacity: 0.8
      }}>
        {loadingText}
      </div>
      <div style={{
        width: '300px',
        height: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #00ff88, #00cc66)',
          animation: 'loading 2s infinite',
          borderRadius: '2px'
        }} />
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function App() {
  const [appReady, setAppReady] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  useEffect(() => {
    // App initialization
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 1000);
    
    // Listen for path changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (!appReady) {
    return <LoadingScreen />;
  }

  // Simple routing based on pathname
  const renderPage = () => {
    if (currentPath === '/download') {
      return <DownloadPage />;
    }
    
    // Default to game
    return (
      <ResponsiveLayout className="w-full h-full">
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
          <Suspense fallback={<LoadingScreen />}>
            <DopeWarsGame />
          </Suspense>
        </div>
      </ResponsiveLayout>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      {renderPage()}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
