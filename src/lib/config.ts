// Configuration for different environments
export const config = {
  // Production API URL - Update this when you deploy your backend
  productionApiUrl: 'wealthbuddy-ai.vercel.app', // Update this URL
  
  // For mobile builds, we need to point to the production API
  isMobile: typeof window !== 'undefined' && window.location.protocol === 'capacitor:',
  
  getApiUrl: (endpoint: string) => {
    // If running in Capacitor (mobile app), always use production API
    if (typeof window !== 'undefined' && window.location.protocol === 'capacitor:') {
      return `${config.productionApiUrl}${endpoint}`;
    }
    
    // For web builds in production, use production API
    if (process.env.NODE_ENV === 'production') {
      return `${config.productionApiUrl}${endpoint}`;
    }
    
    // For development, use relative URLs
    return endpoint;
  },
  
  // App version info
  version: '1.0.0',
  buildNumber: 1,
  
  // App metadata
  appName: 'WealthBuddy',
  appDescription: 'AI-powered personal finance management for Denmark',
  appId: 'com.wealthbuddy.app'
};
