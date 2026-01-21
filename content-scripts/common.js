/**
 * SafeChat Common Utilities
 * Shared classes and functions used across all content scripts
 */

// Initialize modules
const toxicityDetector = new ToxicityDetector();
const phraseRephraser = new PhraseRephraser();

/**
 * OverlayManager - Creates and manages the floating overlay icon
 */
class OverlayManager {
    constructor() {
        this.overlay = null;
        this.currentInputField = null;
    }

    /**
     * Create and show the overlay icon
     * @param {HTMLElement} inputField - The input field element
     * @param {Object} toxicityInfo - Toxicity detection result
     */
    show(inputField, toxicityInfo) {
        // Remove existing overlay if any
        this.hide();

        this.currentInputField = inputField;

        // Create overlay element
        this.overlay = document.createElement('div');
        this.overlay.className = 'safechat-overlay';
        this.overlay.innerHTML = `
      <svg class="safechat-overlay-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    `;

        // Position the overlay
        this.position(inputField);

        // Add click handler
        this.overlay.addEventListener('click', () => {
            this.handleClick(toxicityInfo);
        });

        // Add to DOM
        document.body.appendChild(this.overlay);
    }

    /**
     * Position overlay relative to input field
     * @param {HTMLElement} inputField - The input field element
     */
    position(inputField) {
        const rect = inputField.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;

        // Position to the right of the input field
        this.overlay.style.top = `${rect.top + scrollY + (rect.height / 2) - 16}px`;
        this.overlay.style.left = `${rect.right + scrollX + 8}px`;
    }

    /**
     * Handle overlay click
     * @param {Object} toxicityInfo - Toxicity detection result
     */
    handleClick(toxicityInfo) {
        console.log('SafeChat: Overlay clicked', toxicityInfo);

        // Get current text
        const currentText = this.currentInputField.textContent || this.currentInputField.value || '';

        // Generate suggestion
        const suggestion = phraseRephraser.getSuggestion(currentText, toxicityInfo);

        // Show tooltip
        const tooltip = new TooltipPopup(this.currentInputField, suggestion, this);
        tooltip.show();
    }

    /**
     * Hide and remove the overlay
     */
    hide() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.classList.add('safechat-fade-out');
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
            }, 300);
        }
    }

    /**
     * Update overlay position (for scroll/resize events)
     */
    updatePosition() {
        if (this.overlay && this.currentInputField) {
            this.position(this.currentInputField);
        }
    }
}

/**
 * TooltipPopup - Creates and manages the "Fix It" tooltip
 */
class TooltipPopup {
    constructor(inputField, suggestion, overlayManager) {
        this.inputField = inputField;
        this.suggestion = suggestion;
        this.overlayManager = overlayManager;
        this.tooltip = null;
    }

    /**
     * Create and show the tooltip
     */
    show() {
        // Remove existing tooltip if any
        this.hide();

        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'safechat-tooltip position-top';
        this.tooltip.innerHTML = `
      <div class="safechat-tooltip-header">
        <span>💬 SafeChat Suggestion</span>
        <button class="safechat-tooltip-close" aria-label="Close">×</button>
      </div>
      <div class="safechat-tooltip-content">
        <div class="safechat-text-section">
          <div class="safechat-text-label">Original Text</div>
          <div class="safechat-text-box safechat-original-text">${this.escapeHtml(this.suggestion.original)}</div>
        </div>
        <div class="safechat-text-section">
          <div class="safechat-text-label">Suggested Alternative</div>
          <div class="safechat-text-box safechat-rephrased-text">${this.escapeHtml(this.suggestion.rephrased)}</div>
        </div>
        <div class="safechat-keywords">
          ${this.suggestion.keywords.map(kw => `<span class="safechat-keyword-tag">${this.escapeHtml(kw)}</span>`).join('')}
        </div>
      </div>
      <div class="safechat-tooltip-actions">
        <button class="safechat-btn safechat-btn-secondary" data-action="dismiss">Dismiss</button>
        <button class="safechat-btn safechat-btn-primary" data-action="apply">✓ Apply</button>
      </div>
    `;

        // Position the tooltip
        this.position();

        // Add event listeners
        this.tooltip.querySelector('.safechat-tooltip-close').addEventListener('click', () => this.hide());
        this.tooltip.querySelector('[data-action="dismiss"]').addEventListener('click', () => this.hide());
        this.tooltip.querySelector('[data-action="apply"]').addEventListener('click', () => this.applyRephrase());

        // Add to DOM
        document.body.appendChild(this.tooltip);
    }

    /**
     * Position tooltip relative to input field
     */
    position() {
        const rect = this.inputField.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;

        // Position above the input field
        this.tooltip.style.top = `${rect.top + scrollY - this.tooltip.offsetHeight - 15}px`;
        this.tooltip.style.left = `${rect.left + scrollX}px`;

        // Adjust if going off screen
        const tooltipRect = this.tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            this.tooltip.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
        }
        if (tooltipRect.top < 0) {
            // Position below instead
            this.tooltip.classList.remove('position-top');
            this.tooltip.classList.add('position-bottom');
            this.tooltip.style.top = `${rect.bottom + scrollY + 15}px`;
        }
    }

    /**
     * Apply the rephrased text to the input field
     */
    applyRephrase() {
        console.log('SafeChat: Applying rephrased text');

        // Replace text in the input field
        TextReplacer.replaceText(this.inputField, this.suggestion.rephrased);

        // Hide tooltip and overlay
        this.hide();
        this.overlayManager.hide();

        // Log event
        chrome.runtime.sendMessage({
            type: 'LOG_EVENT',
            event: {
                action: 'text_replaced',
                original: this.suggestion.original,
                rephrased: this.suggestion.rephrased,
                keywords: this.suggestion.keywords
            }
        });
    }

    /**
     * Hide and remove the tooltip
     */
    hide() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.classList.add('safechat-fade-out');
            setTimeout(() => {
                if (this.tooltip && this.tooltip.parentNode) {
                    this.tooltip.parentNode.removeChild(this.tooltip);
                }
                this.tooltip = null;
            }, 300);
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * TextReplacer - Handles text replacement in contenteditable divs
 */
class TextReplacer {
    /**
     * Replace text in an input field (works with contenteditable and regular inputs)
     * @param {HTMLElement} element - Input element
     * @param {string} newText - New text to set
     */
    static replaceText(element, newText) {
        if (element.contentEditable === 'true') {
            // For contenteditable divs (WhatsApp, Discord)
            this.replaceContentEditableText(element, newText);
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            // For regular inputs
            element.value = newText;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Replace text in contenteditable div
     * @param {HTMLElement} element - Contenteditable element
     * @param {string} newText - New text to set
     */
    static replaceContentEditableText(element, newText) {
        console.log('SafeChat: Replacing contenteditable text');
        console.log('SafeChat: Element:', element);
        console.log('SafeChat: New text:', newText);

        // APPROACH 1: Direct React state manipulation
        // Find React's internal properties
        const reactPropsKey = Object.keys(element).find(key =>
            key.startsWith('__reactProps') ||
            key.startsWith('__reactInternalInstance') ||
            key.startsWith('__reactFiber')
        );

        if (reactPropsKey) {
            console.log('SafeChat: Found React key:', reactPropsKey);
            const reactInstance = element[reactPropsKey];
            console.log('SafeChat: React instance:', reactInstance);
        }

        // APPROACH 2: Use native setter to bypass React
        // This is the most reliable method for React apps
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLDivElement.prototype,
            'textContent'
        );

        const nativeInputValueGetter = Object.getOwnPropertyDescriptor(
            window.HTMLDivElement.prototype,
            'textContent'
        );

        // Focus first
        element.focus();
        console.log('SafeChat: Element focused');

        // Select all content
        document.execCommand('selectAll', false, null);
        console.log('SafeChat: Content selected');

        // Delete selected content
        document.execCommand('delete', false, null);
        console.log('SafeChat: Content deleted');

        // Insert new text using execCommand (this triggers proper events)
        document.execCommand('insertText', false, newText);
        console.log('SafeChat: New text inserted via execCommand');

        // If execCommand didn't work, fallback to manual method
        if (element.textContent !== newText) {
            console.warn('SafeChat: execCommand failed, using fallback');

            // Clear element
            element.textContent = '';

            // Create text node
            const textNode = document.createTextNode(newText);
            element.appendChild(textNode);

            // Set cursor at end
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(textNode, newText.length);
            range.setEnd(textNode, newText.length);
            selection.removeAllRanges();
            selection.addRange(range);

            // Use native setter to trigger React
            if (nativeInputValueSetter && nativeInputValueSetter.set) {
                nativeInputValueSetter.set.call(element, newText);
                console.log('SafeChat: Native setter used');
            }

            // Dispatch comprehensive events
            const events = [
                new InputEvent('beforeinput', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: newText,
                    composed: true
                }),
                new InputEvent('input', {
                    bubbles: true,
                    cancelable: false,
                    inputType: 'insertText',
                    data: newText,
                    composed: true
                }),
                new Event('change', { bubbles: true, composed: true }),
                new KeyboardEvent('keydown', { bubbles: true, composed: true }),
                new KeyboardEvent('keyup', { bubbles: true, composed: true }),
                new Event('input', { bubbles: true, composed: true })
            ];

            events.forEach(event => {
                element.dispatchEvent(event);
            });

            console.log('SafeChat: Events dispatched');
        }

        // Force React to update by triggering a blur and focus
        element.blur();
        setTimeout(() => {
            element.focus();

            // Set cursor to end again
            const range = document.createRange();
            const selection = window.getSelection();
            const textNode = element.firstChild;

            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                range.setStart(textNode, textNode.length);
                range.setEnd(textNode, textNode.length);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            console.log('SafeChat: Element refocused');
        }, 50);

        console.log('SafeChat: Text replaced, element should be fully editable');
        console.log('SafeChat: Final element content:', element.textContent);
        console.log('SafeChat: Final element innerHTML:', element.innerHTML);
    }
}

/**
 * Debounce function to limit toxicity checks
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * InlineButtonManager - Manages inline typing bar button
 */
class InlineButtonManager {
    constructor(platform = 'generic') {
        this.platform = platform;
        this.button = null;
        this.currentState = 'inactive';
        this.currentInputField = null;
        this.currentToxicityInfo = null;
        this.currentSuggestion = null;
    }

    /**
     * Create and inject the inline button
     * @param {HTMLElement} container - Container to inject button into
     * @param {HTMLElement} inputField - Associated input field
     * @param {HTMLElement} referenceElement - Optional element to insert before
     */
    inject(container, inputField, referenceElement = null) {
        if (!container || this.button) return;

        this.currentInputField = inputField;

        // Create button element
        this.button = document.createElement('button');
        this.button.className = `safechat-inline-button safechat-${this.platform}-button state-inactive`;
        this.button.setAttribute('aria-label', 'SafeChat - Check message tone');
        this.button.setAttribute('type', 'button');

        // Create icon container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'safechat-inline-icon';
        iconContainer.innerHTML = SafeChatIcons.inactive;

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'safechat-inline-tooltip';
        tooltip.textContent = 'SafeChat';

        this.button.appendChild(iconContainer);
        this.button.appendChild(tooltip);

        // Add click handler
        this.button.addEventListener('click', (e) => this.handleClick(e));

        // Add ripple effect on click
        this.button.addEventListener('mousedown', (e) => this.createRipple(e));

        // Inject into container - before reference element if provided
        if (referenceElement && referenceElement.parentElement === container) {
            container.insertBefore(this.button, referenceElement);
            console.log('SafeChat: Inline button injected before send button');
        } else {
            container.appendChild(this.button);
            console.log('SafeChat: Inline button injected at end');
        }
    }

    /**
     * Update button state based on toxicity
     * @param {Object} toxicityInfo - Toxicity analysis result
     */
    updateState(toxicityInfo) {
        if (!this.button) return;

        this.currentToxicityInfo = toxicityInfo;

        const iconContainer = this.button.querySelector('.safechat-inline-icon');
        const tooltip = this.button.querySelector('.safechat-inline-tooltip');

        // Remove all state classes
        this.button.classList.remove('state-clean', 'state-warning', 'state-danger', 'state-processing', 'state-inactive');

        if (!toxicityInfo || !toxicityInfo.isToxic) {
            // Clean state
            this.currentState = 'clean';
            this.button.classList.add('state-clean');
            iconContainer.innerHTML = SafeChatIcons.clean;
            tooltip.textContent = 'Text looks good! ✓';
            this.button.style.cursor = 'default';
        } else {
            // Determine severity
            const severity = toxicityInfo.severity || toxicityInfo.confidence || 0;

            if (severity >= 0.7) {
                // High toxicity
                this.currentState = 'danger';
                this.button.classList.add('state-danger');
                iconContainer.innerHTML = SafeChatIcons.danger;
                tooltip.textContent = 'Toxic language - Click to fix';
                this.button.style.cursor = 'pointer';
            } else {
                // Mild toxicity
                this.currentState = 'warning';
                this.button.classList.add('state-warning');
                iconContainer.innerHTML = SafeChatIcons.warning;
                tooltip.textContent = 'Mild toxicity - Click to fix';
                this.button.style.cursor = 'pointer';
            }
        }
    }

    /**
     * Set processing state
     */
    setProcessing() {
        if (!this.button) return;

        this.currentState = 'processing';
        this.button.classList.remove('state-clean', 'state-warning', 'state-danger', 'state-inactive');
        this.button.classList.add('state-processing');

        const iconContainer = this.button.querySelector('.safechat-inline-icon');
        const tooltip = this.button.querySelector('.safechat-inline-tooltip');

        iconContainer.innerHTML = SafeChatIcons.processing;
        tooltip.textContent = 'Checking text...';
        this.button.style.cursor = 'wait';
    }

    /**
     * Handle button click
     */
    async handleClick(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('SafeChat: Button clicked, current state:', this.currentState);

        // Only allow click if toxic
        if (this.currentState !== 'warning' && this.currentState !== 'danger') {
            console.log('SafeChat: Button clicked but text is not toxic (state:', this.currentState, ')');
            return;
        }

        if (!this.currentInputField || !this.currentToxicityInfo) {
            console.error('SafeChat: Missing input field or toxicity info');
            return;
        }

        console.log('SafeChat: Fixing toxic text...');
        console.log('SafeChat: Current toxicity info:', this.currentToxicityInfo);

        // Get current text
        const currentText = this.currentInputField.textContent || this.currentInputField.value || '';
        console.log('SafeChat: Current text to rephrase:', currentText);

        if (!currentText || currentText.trim().length === 0) {
            console.error('SafeChat: No text to rephrase!');
            return;
        }

        // Set processing state
        this.setProcessing();

        try {
            // Get rephrased text - use rephraseViaAPI which has fallback
            let rephrasedText;

            if (typeof phraseRephraser !== 'undefined' && phraseRephraser.rephraseViaAPI) {
                // Try API first
                const keywords = this.currentToxicityInfo.keywords || [];
                console.log('SafeChat: Calling rephraseViaAPI with keywords:', keywords);
                rephrasedText = await phraseRephraser.rephraseViaAPI(currentText, keywords);
                console.log('SafeChat: Rephrased text received:', rephrasedText);
            } else {
                console.error('SafeChat: phraseRephraser not available');
                throw new Error('Rephraser not available');
            }

            if (!rephrasedText || rephrasedText.trim().length === 0) {
                console.error('SafeChat: Rephrased text is empty!');
                throw new Error('Rephrased text is empty');
            }

            // Replace text with animation
            console.log('SafeChat: Starting text replacement animation...');
            await this.replaceTextWithAnimation(rephrasedText);

            // Show success
            this.showSuccess();

            // Update to clean state
            this.updateState({ isToxic: false });

            console.log('SafeChat: Text replacement complete!');

        } catch (error) {
            console.error('SafeChat: Error fixing text:', error);
            // Revert to previous state
            this.updateState(this.currentToxicityInfo);
        }
    }

    /**
     * Replace text with smooth animation
     * @param {string} newText - New text to set
     */
    async replaceTextWithAnimation(newText) {
        if (!this.currentInputField) return;

        // Highlight the input field
        const originalBg = this.currentInputField.style.background;
        this.currentInputField.style.transition = 'background 0.3s ease';
        this.currentInputField.style.background = 'rgba(16, 185, 129, 0.1)';

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 200));

        // Replace text
        TextReplacer.replaceText(this.currentInputField, newText);

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 300));

        // Remove highlight
        this.currentInputField.style.background = originalBg;
    }

    /**
     * Show success animation
     */
    showSuccess() {
        if (!this.button) return;

        this.button.classList.add('success-flash');
        setTimeout(() => {
            this.button.classList.remove('success-flash');
        }, 600);
    }

    /**
     * Create ripple effect
     */
    createRipple(e) {
        if (!this.button) return;

        const ripple = document.createElement('span');
        ripple.className = 'safechat-ripple';

        const rect = this.button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        this.button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Remove the button
     */
    remove() {
        if (this.button && this.button.parentNode) {
            this.button.parentNode.removeChild(this.button);
        }
        this.button = null;
        this.currentState = 'inactive';
    }

    /**
     * Check if button exists
     */
    exists() {
        return this.button !== null && this.button.parentNode !== null;
    }
}

console.log('SafeChat: Common utilities loaded');
