/**
 * PhraseRephraser Module
 * Converts toxic phrases to polite alternatives
 * Future: Replace with AI-based rephrasing API
 */

class PhraseRephraser {
    constructor() {
        // Mock rephrasing rules
        this.rephrasingRules = [
            {
                pattern: /you are stupid/gi,
                replacement: "I disagree with your approach"
            },
            {
                pattern: /you'?re stupid/gi,
                replacement: "I see things differently"
            },
            {
                pattern: /shut up/gi,
                replacement: "I'd prefer if we could discuss this calmly"
            },
            {
                pattern: /you'?re an? idiot/gi,
                replacement: "I think there might be a misunderstanding"
            },
            {
                pattern: /you are an? idiot/gi,
                replacement: "I think there might be a misunderstanding"
            },
            {
                pattern: /i hate you/gi,
                replacement: "I'm frustrated with this situation"
            },
            {
                pattern: /you'?re dumb/gi,
                replacement: "I believe there's a better way to think about this"
            },
            {
                pattern: /you are dumb/gi,
                replacement: "I believe there's a better way to think about this"
            },
            {
                pattern: /you'?re a loser/gi,
                replacement: "I'm disappointed with how things turned out"
            },
            {
                pattern: /you'?re pathetic/gi,
                replacement: "I expected better from this situation"
            },
            {
                pattern: /you'?re worthless/gi,
                replacement: "I don't think this is working out"
            },
            {
                pattern: /you'?re useless/gi,
                replacement: "I think we need a different approach"
            },
            {
                pattern: /that'?s garbage/gi,
                replacement: "I don't think that's the best solution"
            },
            {
                pattern: /that'?s trash/gi,
                replacement: "I believe we can do better"
            },
            {
                pattern: /you'?re disgusting/gi,
                replacement: "I'm uncomfortable with this behavior"
            },
            {
                pattern: /you'?re ugly/gi,
                replacement: "I have concerns about this"
            },
            {
                pattern: /moron/gi,
                replacement: "person with a different viewpoint"
            },
            {
                pattern: /stupid/gi,
                replacement: "unclear"
            },
            {
                pattern: /idiot/gi,
                replacement: "someone I disagree with"
            },
            {
                pattern: /dumb/gi,
                replacement: "not well thought out"
            },
            {
                pattern: /hate/gi,
                replacement: "strongly dislike"
            }
        ];
    }

    /**
     * Rephrase toxic text to be more polite
     * @param {string} text - Original toxic text
     * @param {Array} keywords - Detected toxic keywords
     * @returns {string} - Rephrased polite text
     */
    rephrase(text, keywords = []) {
        if (!text) return '';

        let rephrased = text;
        let modified = false;

        // Apply rephrasing rules in order
        for (const rule of this.rephrasingRules) {
            if (rule.pattern.test(rephrased)) {
                rephrased = rephrased.replace(rule.pattern, rule.replacement);
                modified = true;
            }
        }

        // If no specific rule matched but keywords were detected,
        // add a general softening
        if (!modified && keywords.length > 0) {
            rephrased = this.generalSoftening(text, keywords);
        }

        return rephrased;
    }

    /**
     * General text softening when specific rules don't match
     * @param {string} text - Original text
     * @param {Array} keywords - Toxic keywords found
     * @returns {string} - Softened text
     */
    generalSoftening(text, keywords) {
        let softened = text;

        // Remove excessive exclamation marks
        softened = softened.replace(/!{2,}/g, '.');

        // Replace ALL CAPS with normal case if it's shouting
        if (softened === softened.toUpperCase() && softened.length > 10) {
            softened = softened.charAt(0) + softened.slice(1).toLowerCase();
        }

        // Add "Perhaps" or "Maybe" at the beginning if it's a strong statement
        if (softened.match(/^(you|this|that)/i)) {
            softened = "Perhaps " + softened.charAt(0).toLowerCase() + softened.slice(1);
        }

        return softened;
    }

    /**
     * Get suggestions for improving the text
     * @param {string} text - Original text
     * @param {Object} toxicityInfo - Toxicity analysis result
     * @returns {Object} - Suggestion object
     */
    getSuggestion(text, toxicityInfo) {
        const rephrased = this.rephrase(text, toxicityInfo.keywords);

        return {
            original: text,
            rephrased: rephrased,
            reason: `Contains potentially harmful language: ${toxicityInfo.keywords.join(', ')}`,
            confidence: toxicityInfo.confidence,
            keywords: toxicityInfo.keywords
        };
    }

    /**
     * Future: API-based rephrasing via API
     * @param {string} text - Text to rephrase
     * @param {Array} keywords - Toxic keywords
     * @returns {Promise} - API response
     */
    async rephraseViaAPI(text, keywords = []) {
        try {
            // Send message to background script to proxy the API call avoid Mixed Content issues
            const response = await chrome.runtime.sendMessage({
                type: 'REPHRASE_TEXT',
                text: text,
                keywords: keywords
            });

            if (response && response.rephrased) {
                return response.rephrased;
            } else {
                console.warn('SafeChat: API unavailable (via background), using local rephrasing');
                return this.rephrase(text, keywords);
            }
        } catch (error) {
            // Fallback to local rephrasing
            console.warn('SafeChat: API error, using local rephrasing:', error);
            return this.rephrase(text, keywords);
        }
    }

    /**
     * Get suggestion with API support
     * @param {string} text - Original text
     * @param {Object} toxicityInfo - Toxicity analysis result
     * @param {boolean} useAPI - Whether to try API first
     * @returns {Promise} - Suggestion object
     */
    async getSuggestionWithAPI(text, toxicityInfo, useAPI = true) {
        let rephrased;

        if (useAPI) {
            rephrased = await this.rephraseViaAPI(text, toxicityInfo.keywords);
        } else {
            rephrased = this.rephrase(text, toxicityInfo.keywords);
        }

        return {
            original: text,
            rephrased: rephrased,
            reason: `Contains potentially harmful language: ${toxicityInfo.keywords.join(', ')}`,
            confidence: toxicityInfo.confidence,
            keywords: toxicityInfo.keywords
        };
    }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhraseRephraser;
}
