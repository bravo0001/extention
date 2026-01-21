# API Configuration
API_HOST = 'localhost'
API_PORT = 5000
DEBUG = True

# CORS Settings
CORS_ORIGINS = [
    'https://web.whatsapp.com',
    'https://discord.com',
    'chrome-extension://*'
]

# Scraping Settings
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
REQUEST_TIMEOUT = 10
MAX_RETRIES = 3

# Toxicity Detection Settings
TOXICITY_THRESHOLD = 0.7
CONFIDENCE_THRESHOLD = 0.6
