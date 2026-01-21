"""
SafeSpeakAI Backend - Text Rephraser Module
AI-powered and rule-based text rephrasing for polite communication
"""

import re
from typing import Dict, List, Optional


class TextRephraser:
    """Intelligent text rephrasing for converting toxic to polite language"""
    
    def __init__(self):
        # Comprehensive rephrasing rules
        self.phrase_rules = [
            # Direct insults
            {
                'pattern': r'\byou are stupid\b',
                'replacement': "I disagree with your approach",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re stupid\b",
                'replacement': "I see things differently",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\bshut up\b',
                'replacement': "I'd prefer if we could discuss this calmly",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re an? idiot\b",
                'replacement': "I think there might be a misunderstanding",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\byou are an? idiot\b',
                'replacement': "I think there might be a misunderstanding",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\bi hate you\b',
                'replacement': "I'm frustrated with this situation",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re dumb\b",
                'replacement': "I believe there's a better way to think about this",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\byou are dumb\b',
                'replacement': "I believe there's a better way to think about this",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re a loser\b",
                'replacement': "I'm disappointed with how things turned out",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re pathetic\b",
                'replacement': "I expected better from this situation",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re worthless\b",
                'replacement': "I don't think this is working out",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re useless\b",
                'replacement': "I think we need a different approach",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\bthat'?s garbage\b",
                'replacement': "I don't think that's the best solution",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\bthat'?s trash\b",
                'replacement': "I believe we can do better",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r"\byou'?re disgusting\b",
                'replacement': "I'm uncomfortable with this behavior",
                'flags': re.IGNORECASE
            },
            # Single word replacements
            {
                'pattern': r'\bmoron\b',
                'replacement': "person with a different viewpoint",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\bstupid\b',
                'replacement': "unclear",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\bidiot\b',
                'replacement': "someone I disagree with",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\bdumb\b',
                'replacement': "not well thought out",
                'flags': re.IGNORECASE
            },
            {
                'pattern': r'\bhate\b',
                'replacement': "strongly dislike",
                'flags': re.IGNORECASE
            }
        ]
    
    def rephrase(self, text: str, keywords: Optional[List[str]] = None) -> Dict:
        """
        Rephrase toxic text to be more polite
        
        Args:
            text: Original text to rephrase
            keywords: Optional list of detected toxic keywords
            
        Returns:
            Dictionary with original and rephrased text
        """
        if not text or not text.strip():
            return {
                'original': text,
                'rephrased': text,
                'modified': False,
                'confidence': 0.0
            }
        
        rephrased = text
        modified = False
        
        # Apply phrase-based rules first (more specific)
        for rule in self.phrase_rules:
            pattern = rule['pattern']
            replacement = rule['replacement']
            flags = rule.get('flags', 0)
            
            if re.search(pattern, rephrased, flags):
                rephrased = re.sub(pattern, replacement, rephrased, flags=flags)
                modified = True
        
        # If no specific rule matched, apply general softening
        if not modified and keywords:
            rephrased = self._general_softening(text)
            modified = rephrased != text
        
        # Calculate confidence based on how much was changed
        confidence = self._calculate_confidence(text, rephrased)
        
        return {
            'original': text,
            'rephrased': rephrased,
            'modified': modified,
            'confidence': confidence,
            'keywords': keywords or []
        }
    
    def _general_softening(self, text: str) -> str:
        """
        Apply general text softening techniques
        
        Args:
            text: Text to soften
            
        Returns:
            Softened text
        """
        softened = text
        
        # Remove excessive exclamation marks
        softened = re.sub(r'!{2,}', '.', softened)
        
        # Convert ALL CAPS to normal case (if long enough)
        if len(softened) > 10 and softened.isupper():
            softened = softened.capitalize()
        
        # Add softening prefix for strong statements
        if re.match(r'^(you|this|that)\b', softened, re.IGNORECASE):
            softened = "Perhaps " + softened[0].lower() + softened[1:]
        
        return softened
    
    def _calculate_confidence(self, original: str, rephrased: str) -> float:
        """
        Calculate confidence score for the rephrasing
        
        Args:
            original: Original text
            rephrased: Rephrased text
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        if original == rephrased:
            return 0.0
        
        # Simple confidence based on text difference
        original_words = set(original.lower().split())
        rephrased_words = set(rephrased.lower().split())
        
        changed_ratio = len(original_words - rephrased_words) / max(len(original_words), 1)
        
        return min(changed_ratio * 2, 1.0)
    
    def get_suggestion(self, text: str, toxicity_info: Dict) -> Dict:
        """
        Get rephrasing suggestion with additional context
        
        Args:
            text: Original text
            toxicity_info: Toxicity analysis results
            
        Returns:
            Suggestion dictionary
        """
        rephrase_result = self.rephrase(text, toxicity_info.get('keywords', []))
        
        return {
            'original': text,
            'rephrased': rephrase_result['rephrased'],
            'reason': f"Contains potentially harmful language: {', '.join(toxicity_info.get('keywords', []))}",
            'confidence': rephrase_result['confidence'],
            'keywords': toxicity_info.get('keywords', []),
            'categories': toxicity_info.get('categories', [])
        }
    
    def batch_rephrase(self, texts: List[str]) -> List[Dict]:
        """
        Rephrase multiple texts
        
        Args:
            texts: List of texts to rephrase
            
        Returns:
            List of rephrasing results
        """
        return [self.rephrase(text) for text in texts]


# Optional: OpenAI-based rephraser
class AIRephraser:
    """AI-powered text rephrasing using OpenAI API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    def rephrase(self, text: str) -> Dict:
        """
        Rephrase text using OpenAI API
        
        Args:
            text: Text to rephrase
            
        Returns:
            Rephrasing result
        """
        try:
            import openai
            openai.api_key = self.api_key
            
            prompt = f"""Rephrase the following text to be more polite and constructive while maintaining the core message:

Original: {text}

Rephrased:"""
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that rephrases toxic or aggressive text into polite, constructive communication."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            rephrased = response.choices[0].message.content.strip()
            
            return {
                'original': text,
                'rephrased': rephrased,
                'modified': True,
                'confidence': 0.95,
                'source': 'openai'
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'original': text,
                'rephrased': text,
                'modified': False
            }
