/**
 * SafeChat Background Service Worker
 * Handles extension lifecycle and future API communication
 */

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SafeChat installed:', details.reason);
  
  if (details.reason === 'install') {
    // First-time installation
    chrome.storage.local.set({
      enabled: true,
      toxicityThreshold: 0.7,
      autoSuggest: true
    });
  }
});

// Message handling from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.type) {
    case 'CHECK_TOXICITY':
      // Future: Make API call to Python backend
      // For now, return mock response
      handleToxicityCheck(request.text)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'LOG_EVENT':
      // Future: Analytics/logging
      console.log('Event logged:', request.event);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Mock toxicity checker (will be replaced with API call)
 * @param {string} text - Text to check
 * @returns {Promise} - Toxicity analysis result
 */
async function handleToxicityCheck(text) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock implementation - actual logic is in content script
  // This function is here as a placeholder for future backend integration
  return {
    isToxic: false,
    confidence: 0,
    message: 'Check performed in content script'
  };
}

// Keep service worker alive (optional, for debugging)
chrome.runtime.onStartup.addListener(() => {
  console.log('SafeChat service worker started');
});
