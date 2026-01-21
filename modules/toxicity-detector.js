/**
 * ToxicityDetector Module
 * Mock toxicity detection using keyword matching
 * Future: Replace with API call to Python backend
 */

class ToxicityDetector {
    constructor() {
        // Mock toxic keywords list
        this.toxicKeywords = [
            'stupid', 'idiot', 'dumb', 'moron', 'hate',
            'shut up', 'loser', 'pathetic', 'worthless',
            'garbage', 'trash', 'useless', 'disgusting',
            'ugly', 'freak', 'weird'
        ];

        // More severe keywords get higher scores
        this.severityMap = {
            'hate': 0.9,
            'stupid': 0.7,
            'idiot': 0.7,
            'dumb': 0.6,
            'shut up': 0.8,
            'loser': 0.7,
            'pathetic': 0.8,
            'worthless': 0.9,
            'garbage': 0.6,
            'trash': 0.6,
            'useless': 0.7,
            'disgusting': 0.8,
            'ugly': 0.7,
            'freak': 0.7,
            'moron': 0.7,
            'weird': 0.5
        };
    }

    /**
     * Check if text contains toxic content
     * @param {string} text - Input text to analyze
     * @returns {Object} - Analysis result
     */
    analyze(text) {
        if (!text || text.trim().length === 0) {
            return {
                isToxic: false,
                confidence: 0,
                keywords: [],
                severity: 0
            };
        }

        const lowerText = text.toLowerCase();
        const foundKeywords = [];
        let maxSeverity = 0;

        // Check for toxic keywords
        for (const keyword of this.toxicKeywords) {
            if (lowerText.includes(keyword)) {
                foundKeywords.push(keyword);
                const severity = this.severityMap[keyword] || 0.5;
                maxSeverity = Math.max(maxSeverity, severity);
            }
        }

        const isToxic = foundKeywords.length > 0;

        return {
            isToxic,
            confidence: maxSeverity,
            keywords: foundKeywords,
            severity: maxSeverity,
            originalText: text
        };
    }

    /**
     * Future: API-based toxicity check
     * @param {string} text - Text to check
     * @returns {Promise} - API response
     */
    async checkViaAPI(text) {
        try {
            const response = await fetch('http://localhost:5000/api/check-toxicity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                // Fallback to local detection
                console.warn('SafeChat: API unavailable, using local detection');
                return this.analyze(text);
            }
        } catch (error) {
            // Fallback to local detection
            console.warn('SafeChat: API error, using local detection:', error);
            return this.analyze(text);
        }
    }

    /**
     * Analyze text with API support
     * @param {string} text - Text to analyze
     * @param {boolean} useAPI - Whether to try API first
     * @returns {Promise} - Analysis result
     */
    async analyzeWithAPI(text, useAPI = true) {
        if (useAPI) {
            return await this.checkViaAPI(text);
        }
        return this.analyze(text);
    }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToxicityDetector;
}
