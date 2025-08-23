# API Routes

This directory contains API routes that are deployed as Vercel serverless functions.

## Translation API

The translation API uses OpenAI to translate text between languages.

### Setup

1. Add the `OPEN_AI_KEY` environment variable in your Vercel project:
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add a new variable with:
     - Name: `OPEN_AI_KEY`
     - Value: Your OpenAI API key
   - Select which environments to apply it to (Production, Preview, Development)
   - Save the changes

### Usage

```typescript
const translateText = async (text: string, targetLang: string) => {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Translation service error');
    }

    const data = await response.json();
    return data.translation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
};
```

### Parameters

- `text`: The text to translate (required)
- `targetLang`: The target language code (required)
  - Examples: 'fr' for French, 'es' for Spanish, etc.

### Response

```json
{
  "translation": "Translated text here"
}
```

### Error Handling

The API will return appropriate error messages and status codes for various error conditions:

- 400: Missing required parameters
- 405: Method not allowed (only POST is supported)
- 500: OpenAI API key not configured
- 500: OpenAI API error
- 500: Other internal errors 