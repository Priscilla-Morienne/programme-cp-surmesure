// netlify/functions/generate-program.js

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY, // Variable d'environnement Netlify
});

exports.handler = async (event, context) => {
  // Gestion CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gestion preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Vérification méthode POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    };
  }

  try {
    // Parsing des données du questionnaire
    const { niveau, attention, matiere, passion, duree } = JSON.parse(event.body);

    // Validation des données
    if (!niveau || !attention || !matiere || !passion || !duree) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Données manquantes' })
      };
    }

    // Construction du prompt adapté
    const prompt = buildPrompt(niveau, attention, matiere, passion, duree);

    // Appel à Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extraction du contenu
    const programContent = message.content[0].text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        content: programContent 
      })
    };

  } catch (error) {
    console.error('Erreur génération programme:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erreur lors de la génération du programme',
        details: error.message 
      })
    };
  }
};

// Construction du prompt selon les paramètres
function buildPrompt(niveau, attention, matiere, passion, duree) {
  
  // Mapping des niveaux
  const niveauMap = {
    '1': 'début d\'année (septembre-octobre), nombres jusqu\'à 30, syllabes simples',
    '2': 'milieu d\'année (novembre-mars), nombres jusqu\'à 50-60, textes documentaires simples',
    '3': 'fin d\'année (avril-juin), nombres jusqu\'à 100, préparation CE1'
  };

  // Mapping des durées d'attention
  const attentionMap = {
    '15': '15 minutes maximum par activité',
    '30': '30 minutes maximum (15 min lecture + 15 min maths)',
    '45': '45 minutes maximum (20 min lecture + 25 min maths)'
  };

  // Mapping des passions
  const passionMap = {
    'animaux': 'les animaux (ferme, savane, océan, forêt)',
    'superheros': 'les super-héros et aventures',
    'princesses': 'les princesses et châteaux',
    'voitures': 'les voitures et transports',
    'sport': 'le sport et les jeux'
  };

  // Construction du prompt principal
  const basePrompt = `
Crée un programme de révision pour enfant CP ${niveauMap[niveau]}.

PARAMÈTRES :
- Durée : ${duree}
- Attention : ${attentionMap[attention]}
- Matière focus : ${matiere}
- Thème passion : ${passionMap[passion]}

CONTRAINTES IMPORTANTES :
- Style authentique de manuel scolaire (phrases courtes, vocabulaire précis, pas d'adjectifs forcés)
- Conforme aux programmes 2025 (nombres selon niveau, lecture adaptée)
- Include systématiquement des descriptions d'illustrations : [Image : description]
- Ajoute des rappels pédagogiques avant chaque exercice de maths
- Questions de compréhension pour chaque texte
- Format prêt à imprimer en PDF

STYLE LECTURE :
- Textes documentaires simples
- Phrases courtes et directes
- Information factuelle (pas de conte)
- Vocabulaire adapté au niveau

STYLE MATHS :
- Rappel de la notion avec exemple concret avant exercice
- Manipulations visuelles décrites
- Progression logique
- Exercices variés

STRUCTURE DEMANDÉE :
- Programme jour par jour
- Alternance lecture/maths
- Conseils pour les parents
- Activité créative bonus

Génère le programme complet au format markdown avec tous les détails.`;

  return basePrompt;
}

// Export pour les tests (optionnel)
module.exports = { buildPrompt };
