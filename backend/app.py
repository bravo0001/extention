"""
SafeSpeakAI Backend - Flask Application
Main API server for toxicity detection, text rephrasing, and web scraping
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

from config import API_HOST, API_PORT, DEBUG, CORS_ORIGINS
from toxicity_analyzer import ToxicityAnalyzer
from text_rephraser import TextRephraser
from scraper import WebScraper

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": CORS_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize modules
toxicity_analyzer = ToxicityAnalyzer()
text_rephraser = TextRephraser()
web_scraper = WebScraper()


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'service': 'SafeSpeakAI Backend',
        'version': '1.0.0'
    })


@app.route('/api/check-toxicity', methods=['POST'])
def check_toxicity():
    """
    Analyze text for toxic content
    
    Request body:
    {
        "text": "your message here"
    }
    
    Response:
    {
        "isToxic": true,
        "confidence": 0.85,
        "severity": 0.9,
        "keywords": ["hate", "stupid"],
        "categories": ["hate_speech", "insults"],
        "suggestions": ["Consider expressing disagreement..."]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        result = toxicity_analyzer.analyze(text)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/rephrase', methods=['POST'])
def rephrase_text():
    """
    Rephrase toxic text to be more polite
    
    Request body:
    {
        "text": "you are stupid",
        "keywords": ["stupid"]  // optional
    }
    
    Response:
    {
        "original": "you are stupid",
        "rephrased": "I disagree with your approach",
        "modified": true,
        "confidence": 0.9,
        "keywords": ["stupid"]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        keywords = data.get('keywords', None)
        
        result = text_rephraser.rephrase(text, keywords)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/analyze-and-rephrase', methods=['POST'])
def analyze_and_rephrase():
    """
    Combined endpoint: analyze toxicity and get rephrasing suggestion
    
    Request body:
    {
        "text": "you are stupid"
    }
    
    Response:
    {
        "toxicity": {
            "isToxic": true,
            "confidence": 0.85,
            ...
        },
        "suggestion": {
            "original": "you are stupid",
            "rephrased": "I disagree with your approach",
            ...
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        
        # Analyze toxicity
        toxicity_result = toxicity_analyzer.analyze(text)
        
        # Get rephrasing suggestion if toxic
        suggestion = None
        if toxicity_result['isToxic']:
            suggestion = text_rephraser.get_suggestion(text, toxicity_result)
        
        return jsonify({
            'toxicity': toxicity_result,
            'suggestion': suggestion
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/scrape', methods=['POST'])
def scrape_url():
    """
    Scrape content from a URL
    
    Request body:
    {
        "url": "https://example.com",
        "selector": ".content"  // optional CSS selector
    }
    
    Response:
    {
        "success": true,
        "url": "https://example.com",
        "content": "scraped content",
        "status_code": 200
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'error': 'Missing required field: url'
            }), 400
        
        url = data['url']
        selector = data.get('selector', None)
        
        result = web_scraper.scrape_url(url, selector)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/scrape-table', methods=['POST'])
def scrape_table():
    """
    Extract table data from a URL
    
    Request body:
    {
        "url": "https://example.com",
        "table_index": 0  // optional, default 0
    }
    
    Response:
    {
        "success": true,
        "rows": [
            ["header1", "header2"],
            ["data1", "data2"]
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'error': 'Missing required field: url'
            }), 400
        
        url = data['url']
        table_index = data.get('table_index', 0)
        
        rows = web_scraper.scrape_table(url, table_index)
        
        return jsonify({
            'success': True,
            'rows': rows
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/batch-analyze', methods=['POST'])
def batch_analyze():
    """
    Analyze multiple texts for toxicity
    
    Request body:
    {
        "texts": ["text1", "text2", "text3"]
    }
    
    Response:
    {
        "results": [
            {"isToxic": false, ...},
            {"isToxic": true, ...},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({
                'error': 'Missing required field: texts'
            }), 400
        
        texts = data['texts']
        
        if not isinstance(texts, list):
            return jsonify({
                'error': 'texts must be an array'
            }), 400
        
        results = toxicity_analyzer.batch_analyze(texts)
        
        return jsonify({
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    print(f"🚀 SafeSpeakAI Backend starting on http://{API_HOST}:{API_PORT}")
    print(f"📡 CORS enabled for: {', '.join(CORS_ORIGINS)}")
    print(f"🔧 Debug mode: {DEBUG}")
    
    app.run(
        host=API_HOST,
        port=API_PORT,
        debug=DEBUG
    )
