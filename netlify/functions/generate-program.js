exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gestion CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Test basique d'abord
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    };
  }

  try {
    // Test 1: vérifier qu'on reçoit les données
    const body = JSON.parse(event.body);
    console.log('Données reçues:', body);

    // Test 2: vérifier la clé API
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Clé API manquante' })
      };
    }

    console.log('Clé API présente:', apiKey ? 'OUI' : 'NON');

    // Test 3: appel Claude simplifié
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: 'Génère un simple programme de révision CP de 2 jours sur les animaux'
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur Claude:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Erreur Claude API', 
          details: errorText 
        })
      };
    }

    const claudeData = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        content: claudeData.content[0].text
      })
    };

  } catch (error) {
    console.error('Erreur complète:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur serveur',
        details: error.message
      })
    };
  }
};
