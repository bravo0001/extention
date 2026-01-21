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
      // Make API call to Python backend
      handleToxicityCheck(request.text)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open for async response

    case 'REPHRASE_TEXT':
      // Make API call to Python backend
      handleRephrase(request.text, request.keywords)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open

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
 * Handle toxicity check via backend API
 * @param {string} text - Text to check
 * @returns {Promise} - Toxicity analysis result
 */
async function handleToxicityCheck(text) {
  try {
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Return safe fallback
    return { isToxic: false, confidence: 0, error: true };
  }
}

/**
 * Handle rephrasing via backend API
 * @param {string} text - Text to rephrase
 * @param {Array} keywords - Toxic keywords
 * @returns {Promise} - API response
 */
async function handleRephrase(text, keywords) {
  try {
    const response = await fetch('http://localhost:5000/api/rephrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, keywords })
    });

    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Keep service worker alive (optional, for debugging)
chrome.runtime.onStartup.addListener(() => {
  console.log('SafeChat service worker started');
});
