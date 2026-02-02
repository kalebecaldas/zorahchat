import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 5 seconds if not dismissed before
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      right: '1rem',
      zIndex: 1000,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      padding: '1rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          fontSize: '14px'
        }}
      >
        ✕
      </button>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          💬
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '600', 
            color: 'white',
            fontSize: '0.875rem',
            marginBottom: '0.25rem'
          }}>
            Instalar ZORAH CHAT
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Adicione à tela inicial para acesso rápido
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleInstallClick}
          style={{
            flex: 1,
            padding: '0.625rem',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Instalar App
        </button>
        
        <button
          onClick={handleDismiss}
          style={{
            padding: '0.625rem 1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
