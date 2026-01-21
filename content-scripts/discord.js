/**
 * SafeChat - Discord Content Script
 * Detects and moderates toxic content in Discord
 */

console.log('SafeChat: Discord script loaded');

// Initialize managers
const inlineButtonManager = new InlineButtonManager('discord');
let currentInputField = null;
let currentButtonContainer = null;
let lastCheckedText = '';

/**
 * Discord-specific selectors
 * Discord uses React, so selectors may change
 */
const DISCORD_SELECTORS = {
    // Message input field
    inputField: [
        'div[role="textbox"][data-slate-editor="true"]',  // Main chat input
        'div[contenteditable="true"][data-slate-editor]',  // Alternative
        'div.slateTextArea-1Mkdgw',  // Class-based fallback
        'div[class*="slateTextArea"]'  // Pattern-based fallback
    ],
    // Message container
    messageContainer: [
        'main[class*="chatContent"]',
        'div[class*="messagesWrapper"]'
    ]
};

/**
 * Find the Discord input field
 * @returns {HTMLElement|null} - Input field element
 */
function findInputField() {
    for (const selector of DISCORD_SELECTORS.inputField) {
        const element = document.querySelector(selector);
        if (element) {
            console.log('SafeChat: Found Discord input with selector:', selector);
            return element;
        }
    }
    return null;
}

/**
 * Find the send button in Discord
 * @returns {HTMLElement|null} - Send button element
 */
function findSendButton() {
    // Discord send button selectors
    const sendButton = document.querySelector('button[type="submit"]') ||
        document.querySelector('button[aria-label*="Send"]') ||
        document.querySelector('[class*="sendButton"]') ||
        document.querySelector('[class*="buttonContainer"] button');

    return sendButton;
}

/**
 * Find the Discord button container
 * Returns an object with container and reference element for positioning
 * @returns {Object|null} - {container, referenceElement}
 */
function findButtonContainer() {
    const inputField = findInputField();
    if (!inputField) {
        console.warn('SafeChat: Input field not found');
        return null;
    }

    // Find the send button to position our button before it
    const sendButton = findSendButton();

    if (sendButton) {
        console.log('SafeChat: Found Discord send button, will insert before it');
        return {
            container: sendButton.parentElement,
            referenceElement: sendButton
        };
    }

    // Strategy 1: Look for the form element (Discord wraps input in a form)
    let container = inputField.closest('form');
    if (container) {
        // Look for button container within the form
        const buttonContainer = container.querySelector('[class*="buttons"]') ||
            container.querySelector('[class*="attachWrapper"]') ||
            container.querySelector('[class*="channelAttach"]');
        if (buttonContainer) {
            console.log('SafeChat: Found Discord button container via form element');
            return { container: buttonContainer, referenceElement: null };
        }
    }

    // Strategy 2: Look for the input field's parent container with buttons
    container = inputField.parentElement;
    let depth = 0;
    while (container && depth < 10) {
        // Look for a container that has buttons or icons
        const buttons = container.querySelectorAll('button');
        const hasButtonClasses = container.className && (
            container.className.includes('buttons') ||
            container.className.includes('attachWrapper') ||
            container.className.includes('channelAttach')
        );

        if (buttons.length > 0 || hasButtonClasses) {
            console.log('SafeChat: Found Discord button container via parent traversal');
            return { container, referenceElement: null };
        }
        container = container.parentElement;
        depth++;
    }

    // Strategy 3: Create a wrapper container next to the input field
    // This is better than using the input's direct parent
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: inline-flex; align-items: center; margin-left: 8px;';

    // Find the best place to insert the wrapper
    const inputParent = inputField.parentElement;
    if (inputParent) {
        // Try to insert after the input field
        if (inputField.nextSibling) {
            inputParent.insertBefore(wrapper, inputField.nextSibling);
        } else {
            inputParent.appendChild(wrapper);
        }
        console.log('SafeChat: Created custom button container wrapper');
        return { container: wrapper, referenceElement: null };
    }

    // Last resort: use input field's parent (should rarely reach here now)
    console.warn('SafeChat: Using input parent as button container (fallback)');
    return { container: inputField.parentElement, referenceElement: null };
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
    console.log('SafeChat: Setting up observer for Discord input');

    // Find and inject inline button
    if (!inlineButtonManager.exists()) {
        const containerInfo = findButtonContainer();
        if (containerInfo) {
            inlineButtonManager.inject(containerInfo.container, inputField, containerInfo.referenceElement);
        } else {
            console.warn('SafeChat: Could not find button container, will retry...');
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

    console.log('SafeChat: Observer active for Discord input');
}

/**
 * Initialize SafeChat for Discord
 */
function initializeSafeChat() {
    console.log('SafeChat: Initializing for Discord');

    // Try to find input field immediately
    const inputField = findInputField();
    if (inputField) {
        observeInputField(inputField);
    }

    // Watch for the input field to appear (Discord loads dynamically)
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

    console.log('SafeChat: Discord page observer active');
}

/**
 * Wait for Discord to load
 */
function waitForDiscord() {
    // Check if Discord has loaded (look for specific elements)
    const checkInterval = setInterval(() => {
        const appElement = document.querySelector('[class*="app"]');
        if (appElement) {
            console.log('SafeChat: Discord app detected');
            clearInterval(checkInterval);
            initializeSafeChat();
        }
    }, 1000);

    // Also try immediately
    if (document.querySelector('[class*="app"]')) {
        initializeSafeChat();
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDiscord);
} else {
    waitForDiscord();
}

console.log('SafeChat: Discord script initialized');
