"""
SafeSpeakAI Backend - Toxicity Analyzer Module
Advanced toxicity detection with ML-based analysis
"""

import re
from typing import Dict, List
from config import TOXICITY_THRESHOLD, CONFIDENCE_THRESHOLD


class ToxicityAnalyzer:
    """Advanced toxicity detection and analysis"""
    
    def __init__(self):
        # Enhanced toxic keywords with categories
        self.toxic_patterns = {
            'hate_speech': {
                'keywords': ['hate', 'despise', 'detest', 'loathe'],
                'severity': 0.9
            },
            'insults': {
                'keywords': ['stupid', 'idiot', 'dumb', 'moron', 'fool', 'imbecile'],
                'severity': 0.7
            },
            'profanity': {
                'keywords': ['damn', 'hell', 'crap'],
                'severity': 0.5
            },
            'aggressive': {
                'keywords': ['shut up', 'get lost', 'go away'],
                'severity': 0.8
            },
            'derogatory': {
                'keywords': ['loser', 'pathetic', 'worthless', 'useless', 'garbage', 'trash'],
                'severity': 0.8
            },
            'offensive': {
                'keywords': ['disgusting', 'ugly', 'freak', 'weird', 'creep'],
                'severity': 0.7
            }
        }
        
        # Severity multipliers for context
        self.context_multipliers = {
            'repeated_chars': 1.2,  # e.g., "stupidddd"
            'all_caps': 1.3,        # e.g., "YOU ARE STUPID"
            'multiple_exclamation': 1.2  # e.g., "stupid!!!"
        }
    
    def analyze(self, text: str) -> Dict:
        """
        Analyze text for toxic content
        
        Args:
            text: The text to analyze
            
        Returns:
            Dictionary with toxicity analysis results
        """
        if not text or not text.strip():
            return {
                'isToxic': False,
                'confidence': 0.0,
                'severity': 0.0,
                'keywords': [],
                'categories': [],
                'suggestions': []
            }
        
        text_lower = text.lower()
        found_keywords = []
        categories = []
        max_severity = 0.0
        
        # Check for toxic patterns
        for category, data in self.toxic_patterns.items():
            for keyword in data['keywords']:
                if keyword in text_lower:
                    found_keywords.append(keyword)
                    categories.append(category)
                    max_severity = max(max_severity, data['severity'])
        
        # Apply context multipliers
        context_score = self._analyze_context(text)
        adjusted_severity = min(max_severity * context_score, 1.0)
        
        is_toxic = len(found_keywords) > 0 and adjusted_severity >= CONFIDENCE_THRESHOLD
        
        return {
            'isToxic': is_toxic,
            'confidence': adjusted_severity,
            'severity': adjusted_severity,
            'keywords': list(set(found_keywords)),
            'categories': list(set(categories)),
            'suggestions': self._generate_suggestions(categories) if is_toxic else [],
            'originalText': text
        }
    
    def _analyze_context(self, text: str) -> float:
        """
        Analyze contextual factors that affect toxicity
        
        Args:
            text: The text to analyze
            
        Returns:
            Context multiplier (1.0 = no change, >1.0 = more toxic)
        """
        multiplier = 1.0
        
        # Check for repeated characters
        if re.search(r'(.)\1{2,}', text):
            multiplier *= self.context_multipliers['repeated_chars']
        
        # Check for all caps (excluding short text)
        if len(text) > 10 and text.isupper():
            multiplier *= self.context_multipliers['all_caps']
        
        # Check for multiple exclamation marks
        if text.count('!') >= 2:
            multiplier *= self.context_multipliers['multiple_exclamation']
        
        return multiplier
    
    def _generate_suggestions(self, categories: List[str]) -> List[str]:
        """
        Generate suggestions based on detected categories
        
        Args:
            categories: List of detected toxicity categories
            
        Returns:
            List of suggestion strings
        """
        suggestions = []
        
        if 'hate_speech' in categories:
            suggestions.append("Consider expressing disagreement without using hateful language")
        
        if 'insults' in categories:
            suggestions.append("Try focusing on the issue rather than personal attacks")
        
        if 'aggressive' in categories:
            suggestions.append("A calmer tone might lead to better communication")
        
        if 'derogatory' in categories:
            suggestions.append("Respectful language helps maintain positive relationships")
        
        return suggestions
    
    def batch_analyze(self, texts: List[str]) -> List[Dict]:
        """
        Analyze multiple texts
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of analysis results
        """
        return [self.analyze(text) for text in texts]
    
    def get_toxicity_score(self, text: str) -> float:
        """
        Get a simple toxicity score (0.0 to 1.0)
        
        Args:
            text: The text to score
            
        Returns:
            Toxicity score
        """
        result = self.analyze(text)
        return result['severity']


# Optional: Integration with Google Perspective API
class PerspectiveAPIAnalyzer:
    """Toxicity detection using Google Perspective API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze'
    
    def analyze(self, text: str) -> Dict:
        """
        Analyze text using Perspective API
        
        Args:
            text: The text to analyze
            
        Returns:
            Analysis results
        """
        import requests
        
        try:
            payload = {
                'comment': {'text': text},
                'languages': ['en'],
                'requestedAttributes': {
                    'TOXICITY': {},
                    'SEVERE_TOXICITY': {},
                    'INSULT': {},
                    'PROFANITY': {}
                }
            }
            
            response = requests.post(
                f"{self.endpoint}?key={self.api_key}",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                scores = data.get('attributeScores', {})
                
                toxicity_score = scores.get('TOXICITY', {}).get('summaryScore', {}).get('value', 0)
                
                return {
                    'isToxic': toxicity_score > TOXICITY_THRESHOLD,
                    'confidence': toxicity_score,
                    'severity': toxicity_score,
                    'source': 'perspective_api'
                }
            else:
                return {'error': 'API request failed', 'status_code': response.status_code}
                
        except Exception as e:
            return {'error': str(e)}
