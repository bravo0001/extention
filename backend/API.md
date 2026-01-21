# SafeSpeakAI API Documentation

Base URL: `http://localhost:5000`

## Endpoints

### 1. Health Check

**GET** `/`

Check if the API server is running.

**Response:**
```json
{
  "status": "running",
  "service": "SafeSpeakAI Backend",
  "version": "1.0.0"
}
```

---

### 2. Check Toxicity

**POST** `/api/check-toxicity`

Analyze text for toxic content.

**Request Body:**
```json
{
  "text": "your message here"
}
```

**Response:**
```json
{
  "isToxic": true,
  "confidence": 0.85,
  "severity": 0.9,
  "keywords": ["hate", "stupid"],
  "categories": ["hate_speech", "insults"],
  "suggestions": [
    "Consider expressing disagreement without using hateful language",
    "Try focusing on the issue rather than personal attacks"
  ],
  "originalText": "your message here"
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing required field
- `500 Internal Server Error` - Server error

---

### 3. Rephrase Text

**POST** `/api/rephrase`

Rephrase toxic text to be more polite.

**Request Body:**
```json
{
  "text": "you are stupid",
  "keywords": ["stupid"]  // optional
}
```

**Response:**
```json
{
  "original": "you are stupid",
  "rephrased": "I disagree with your approach",
  "modified": true,
  "confidence": 0.9,
  "keywords": ["stupid"]
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing required field
- `500 Internal Server Error` - Server error

---

### 4. Analyze and Rephrase (Combined)

**POST** `/api/analyze-and-rephrase`

Combined endpoint that analyzes toxicity and provides rephrasing suggestion.

**Request Body:**
```json
{
  "text": "you are stupid"
}
```

**Response:**
```json
{
  "toxicity": {
    "isToxic": true,
    "confidence": 0.85,
    "severity": 0.9,
    "keywords": ["stupid"],
    "categories": ["insults"]
  },
  "suggestion": {
    "original": "you are stupid",
    "rephrased": "I disagree with your approach",
    "reason": "Contains potentially harmful language: stupid",
    "confidence": 0.9,
    "keywords": ["stupid"],
    "categories": ["insults"]
  }
}
```

---

### 5. Web Scraping

**POST** `/api/scrape`

Scrape content from a URL.

**Request Body:**
```json
{
  "url": "https://example.com",
  "selector": ".content"  // optional CSS selector
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "content": "scraped content here",
  "status_code": 200
}
```

**Error Response:**
```json
{
  "success": false,
  "url": "https://example.com",
  "error": "Connection timeout"
}
```

---

### 6. Scrape Table

**POST** `/api/scrape-table`

Extract table data from a webpage.

**Request Body:**
```json
{
  "url": "https://example.com/table-page",
  "table_index": 0  // optional, default 0
}
```

**Response:**
```json
{
  "success": true,
  "rows": [
    ["Header 1", "Header 2", "Header 3"],
    ["Data 1", "Data 2", "Data 3"],
    ["Data 4", "Data 5", "Data 6"]
  ]
}
```

---

### 7. Batch Analyze

**POST** `/api/batch-analyze`

Analyze multiple texts for toxicity.

**Request Body:**
```json
{
  "texts": [
    "Hello, how are you?",
    "You are stupid",
    "This is great!"
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "isToxic": false,
      "confidence": 0.0,
      "keywords": []
    },
    {
      "isToxic": true,
      "confidence": 0.85,
      "keywords": ["stupid"]
    },
    {
      "isToxic": false,
      "confidence": 0.0,
      "keywords": []
    }
  ]
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request (missing fields, invalid data)
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider implementing rate limiting to prevent abuse.

---

## CORS

The API is configured to accept requests from:
- `https://web.whatsapp.com`
- `https://discord.com`
- `chrome-extension://*`

To add more origins, edit `backend/config.py`.

---

## Examples

### cURL Examples

**Check Toxicity:**
```bash
curl -X POST http://localhost:5000/api/check-toxicity \
  -H "Content-Type: application/json" \
  -d '{"text": "you are stupid"}'
```

**Rephrase Text:**
```bash
curl -X POST http://localhost:5000/api/rephrase \
  -H "Content-Type: application/json" \
  -d '{"text": "you are stupid", "keywords": ["stupid"]}'
```

**Scrape URL:**
```bash
curl -X POST http://localhost:5000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "selector": "p"}'
```

### JavaScript Examples

**Using Fetch API:**
```javascript
// Check toxicity
const response = await fetch('http://localhost:5000/api/check-toxicity', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'you are stupid'
  })
});

const result = await response.json();
console.log(result);
```

**Rephrase text:**
```javascript
const response = await fetch('http://localhost:5000/api/rephrase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'you are stupid',
    keywords: ['stupid']
  })
});

const result = await response.json();
console.log(result.rephrased);
```

---

## Development

To test the API:

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Use tools like:
   - Postman
   - Insomnia
   - cURL
   - Browser DevTools

---

## Future Enhancements

Planned features:
- Authentication and API keys
- Rate limiting
- Caching layer (Redis)
- Database integration for analytics
- Advanced ML models (Perspective API, OpenAI)
- Webhook support
- Real-time WebSocket connections
