'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    // Immediately redirect to the HTML redirect page for mobile compatibility
    if (typeof window !== 'undefined') {
      // Check if we're in a mobile environment
      const isMobile = window.location.protocol === 'capacitor:' || 
                      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile, use the HTML redirect page
        window.location.href = '/mobile-redirect.html';
      } else {
        // For web, do the normal check
        const userData = localStorage.getItem('wealthbuddy_user');
        if (userData) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login';
        }
      }
    }
  }, []);

  // Simple loading screen that should only show briefly
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
          WealthBuddy AI
        </h1>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Redirecting...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
