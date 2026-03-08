import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simplified approach - removed complex wallet components that caused ethereum conflicts

// Error boundary for app crashes
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d4f3c 100%)', 
          color: 'white',
          fontFamily: 'Inter, sans-serif',
          flexDirection: 'column'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
            <h1 style={{
              background: 'linear-gradient(45deg, #00ff88, #00cc66)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              THC DOPE BUDZ
            </h1>
            <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
              App encountered an error. This might be due to browser compatibility or extension conflicts.
            </p>
            <p style={{ marginBottom: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '12px 24px', 
                background: 'linear-gradient(45deg, #00ff88, #00cc66)', 
                color: '#000', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
