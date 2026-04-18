// netlify/functions/generateImage.js
export const handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  // Get API key from Netlify environment variables
  const API_KEY = process.env.SILICONFLOW_API_KEY || 'sk-zqyofjdakvhsujaftchomlgdcqtspkyyvnydpdheyflrkzfr';

  if (!API_KEY) {
    console.error('Server Configuration Error: SILICONFLOW_API_KEY is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Server configuration error: Missing API Key' })
    };
  }

  try {
    // Forward the exact body payload from the frontend to the SiliconFlow API
    const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: event.body
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('SiliconFlow API Error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Function Execution Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};