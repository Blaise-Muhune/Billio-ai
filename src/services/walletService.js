import { authService } from './authService';

export const walletService = {
  async generateAppleWalletPass(card) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to generate wallet passes');
      }

      // Make API call to your backend service that generates the .pkpass file
      const response = await fetch('/api/wallet/generate-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(card)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate wallet pass');
      }

      // Get the .pkpass file as a blob
      const passBlob = await response.blob();
      
      // Create a download URL for the pass
      const passUrl = window.URL.createObjectURL(passBlob);
      
      // Create and trigger the download
      const link = document.createElement('a');
      link.href = passUrl;
      link.type = 'application/vnd.apple.pkpass';
      link.download = `${card.name.replace(/\s+/g, '_')}.pkpass`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(passUrl);
    } catch (error) {
      console.error('Error generating wallet pass:', error);
      throw error;
    }
  },

  // Check if the device supports Apple Wallet
  isAppleWalletSupported() {
    // Check if the device is running iOS or macOS
    const isAppleDevice = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if the device supports adding passes to wallet
    // This checks for the presence of the addToWallet API
    const hasWalletSupport = 'withSafariViewController' in window || 
                            'withSafariView' in window || 
                            document.createElement('link').relList.supports('smartcard');
    
    return isAppleDevice && hasWalletSupport;
  }
}; 