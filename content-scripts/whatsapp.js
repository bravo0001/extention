/**
 * SafeChat - WhatsApp Web Content Script
 * Detects and moderates toxic content in WhatsApp Web
 */

console.log('SafeChat: WhatsApp script loaded');

// Initialize managers
const inlineButtonManager = new InlineButtonManager('whatsapp');
let currentInputField = null;
let currentButtonContainer = null;
let lastCheckedText = '';

/**
 * WhatsApp-specific selectors
 * Note: WhatsApp frequently changes their class names, these are common patterns
 */
const WHATSAPP_SELECTORS = {
    // Primary message input (footer composer)
    inputField: [
        'div[contenteditable="true"][data-tab="10"]',  // Main chat input
        'div[contenteditable="true"][role="textbox"]',  // Alternative
        'div._ak1r',  // Class-based fallback
        'div[contenteditable="true"][data-lexical-editor="true"]'  // Newer version
    ],
    // Message input container
    inputContainer: [
        'div[data-tab="10"]',
        'footer'
    ],
    // Button container (where emoji, attach, etc. buttons are)
    buttonContainer: [
        'footer div[role="button"]',  // Button group
        'footer span[data-icon]',  // Icon container
        'footer ._ak1l',  // Class-based
        'footer > div > div > div > span'  // Structure-based
    ]
};

/**
 * Find the WhatsApp input field
 * @returns {HTMLElement|null} - Input field element
 */
function findInputField() {
    for (const selector of WHATSAPP_SELECTORS.inputField) {
        const element = document.querySelector(selector);
        if (element) {
            console.log('SafeChat: Found WhatsApp input with selector:', selector);
            return element;
        }
    }
    return null;
}

/**
 * Find the send button in WhatsApp footer
 * @returns {HTMLElement|null} - Send button element
 */
function findSendButton() {
    const footer = document.querySelector('footer');
    if (!footer) return null;

    // Look for send button
    const sendButton = footer.querySelector('span[data-icon="send"]') ||
        footer.querySelector('[data-testid="send"]') ||
        footer.querySelector('button[aria-label*="Send"]');

    if (sendButton) {
        // Find the actual button element (might be parent)
        let btn = sendButton;
        while (btn && btn.tagName !== 'BUTTON' && btn !== footer) {
            btn = btn.parentElement;
        }
        return btn.tagName === 'BUTTON' ? btn : sendButton.parentElement;
    }

    return null;
}

/**
 * Find the WhatsApp button container (footer toolbar)
 * Returns an object with container and reference element for positioning
 * @returns {Object|null} - {container, referenceElement}
 */
function findButtonContainer() {
    // Try multiple footer selectors
    const footer = document.querySelector('footer') ||
        document.querySelector('[role="contentinfo"]');

    if (!footer) {
        console.warn('SafeChat: Footer not found - WhatsApp may still be loading');
        return null;
    }

    console.log('SafeChat: Footer found');

    // Find the send button to position our button before it
    const sendButton = findSendButton();

    if (sendButton) {
        console.log('SafeChat: Found send button, will insert before it');
        return {
            container: sendButton.parentElement,
            referenceElement: sendButton
        };
    }

    // Fallback: Look for emoji button area
    const emojiButton = footer.querySelector('span[data-icon="smiley"]') ||
        footer.querySelector('span[data-icon="emoji"]');

    if (emojiButton) {
        let container = emojiButton.parentElement;
        let depth = 0;
        while (container && container !== footer && depth < 10) {
            if (container.children.length >= 2) {
                console.log('SafeChat: Found button container via emoji button');
                return { container, referenceElement: null };
            }
            container = container.parentElement;
            depth++;
        }
    }

    // Last resort: use footer
    console.warn('SafeChat: Using footer as button container (fallback)');
    return { container: footer, referenceElement: null };
}

/**
 * Check text for toxicity and update inline button
 * @param {string} text - Text to check
 * @param {HTMLElement} inputField - Input field element
 */
function checkTextToxicity(text, inputField) {
    // Skip if text is empty or unchanged
    if (!text || text.trim().length === 0 || text === lastCheckedText) {
        // If text is empty, set to inactive
        if (!text || text.trim().length === 0) {
            inlineButtonManager.updateState({ isToxic: false });
        }
        return;
    }

    lastCheckedText = text;

    // Set processing state
    inlineButtonManager.setProcessing();

    // Analyze toxicity
    const result = toxicityDetector.analyze(text);

    console.log('SafeChat: Toxicity check result:', result);

    // Update button state
    inlineButtonManager.updateState(result);
}

/**
 * Debounced toxicity checker (500ms delay)
 */
const debouncedCheck = debounce((text, inputField) => {
    checkTextToxicity(text, inputField);
}, 500);

/**
 * Handle input changes
 * @param {HTMLElement} inputField - Input field element
 */
function handleInputChange(inputField) {
    const text = inputField.textContent || inputField.innerText || '';
    debouncedCheck(text, inputField);
}

/**
 * Setup MutationObserver for the input field
 * @param {HTMLElement} inputField - Input field element
 */
function observeInputField(inputField) {
    if (currentInputField === inputField) {
        return; // Already observing this field
    }

    currentInputField = inputField;
    console.log('SafeChat: Setting up observer for WhatsApp input');

    // Find and inject inline button with retry logic
    if (!inlineButtonManager.exists()) {
        // Try immediately
        let containerInfo = findButtonContainer();
        if (containerInfo) {
            inlineButtonManager.inject(containerInfo.container, inputField, containerInfo.referenceElement);
        } else {
            console.warn('SafeChat: Could not find button container, retrying in 1s...');

            // Retry after 1 second
            setTimeout(() => {
                if (!inlineButtonManager.exists()) {
                    containerInfo = findButtonContainer();
                    if (containerInfo) {
                        inlineButtonManager.inject(containerInfo.container, inputField, containerInfo.referenceElement);
                    } else {
                        console.warn('SafeChat: Could not find button container, retrying in 2s...');

                        // Final retry after 2 more seconds
                        setTimeout(() => {
                            if (!inlineButtonManager.exists()) {
                                containerInfo = findButtonContainer();
                                if (containerInfo) {
                                    inlineButtonManager.inject(containerInfo.container, inputField, containerInfo.referenceElement);
                                } else {
                                    console.error('SafeChat: Failed to find button container after retries');
                                }
                            }
                        }, 2000);
                    }
                }
            }, 1000);
        }
    }

    // Create observer for text changes
    const observer = new MutationObserver((mutations) => {
        handleInputChange(inputField);
    });

    // Observe character data changes and child list changes
    observer.observe(inputField, {
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    });

    // Also listen to input events
    inputField.addEventListener('input', () => {
        handleInputChange(inputField);
    });

    // Listen to keyup events
    inputField.addEventListener('keyup', () => {
        handleInputChange(inputField);
    });

    console.log('SafeChat: Observer active for WhatsApp input');
}

/**
 * Initialize SafeChat for WhatsApp
 */
function initializeSafeChat() {
    console.log('SafeChat: Initializing for WhatsApp Web');

    // Try to find input field immediately
    const inputField = findInputField();
    if (inputField) {
        observeInputField(inputField);
    }

    // Watch for the input field to appear (WhatsApp loads dynamically)
    const pageObserver = new MutationObserver(() => {
        const inputField = findInputField();
        if (inputField && inputField !== currentInputField) {
            observeInputField(inputField);
        }
    });

    // Observe the entire body for new elements
    pageObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('SafeChat: WhatsApp page observer active');
}

/**
 * Wait for WhatsApp to load
 */
function waitForWhatsApp() {
    // Check if WhatsApp has loaded (look for specific elements)
    const checkInterval = setInterval(() => {
        const appElement = document.querySelector('#app');
        if (appElement) {
            console.log('SafeChat: WhatsApp app detected');
            clearInterval(checkInterval);
            initializeSafeChat();
        }
    }, 1000);

    // Also try immediately
    if (document.querySelector('#app')) {
        initializeSafeChat();
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForWhatsApp);
} else {
    waitForWhatsApp();
}

console.log('SafeChat: WhatsApp script initialized');
