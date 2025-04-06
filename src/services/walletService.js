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
        body: JSON.stringify({
          cardId: card.id,
          name: card.name,
          company: card.company,
          title: card.title,
          emails: card.emails,
          phones: card.phones,
          websites: card.websites
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate wallet pass');
      }

      // Get the .pkpass file as a blob
      const passBlob = await response.blob();
      
      // Create a download URL for the pass
      const passUrl = window.URL.createObjectURL(passBlob);
      
      // Create and trigger the download
      const link = document.createElement('a');
      link.href = passUrl;
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
    // Check if the device is running iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if the device supports Apple Wallet
    // This checks for the presence of the Apple Pay API which is a good indicator
    // that the device supports wallet passes
    const hasWallet = window.ApplePaySession && ApplePaySession.canMakePayments();
    
    return isIOS && hasWallet;
  }
}; 