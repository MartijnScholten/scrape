// netlify/functions/manual-check-bidding.js

const axios = require('axios');
const crypto = require('crypto');

// Globale variabele voor de vorige hash
let previousHash = '';

// Functie om de .bidding-history content op te halen
async function extractBiddingHistory(url) {
  // Haal de volledige pagina op
  const response = await axios.get(url);
  const html = response.data;
  
  // Extraheer de .bidding-history element met een regex
  const biddingHistoryRegex = /<div[^>]*class="[^"]*bidding-history[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
  const match = html.match(biddingHistoryRegex);
  
  if (!match || !match[0]) {
    throw new Error("Kon .bidding-history element niet vinden op de pagina");
  }
  
  // Gebruik alleen het gevonden .bidding-history element
  return match[0];
}

// Deze functie kan direct worden aangeroepen vanaf de frontend
exports.handler = async function(event, context) {
  // CORS headers toevoegen
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Alleen POST requests toestaan
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Request body parsen
    const requestBody = JSON.parse(event.body || '{}');
    
    // Website URL uit de request halen of uit de omgevingsvariabele
    const websiteUrl = requestBody.url || process.env.WEBSITE_URL;
    
    if (!websiteUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Website URL niet opgegeven' })
      };
    }
    
    // Haal de .bidding-history content op
    const biddingContent = await extractBiddingHistory(websiteUrl);
    
    // Bereken een hash van de content
    const currentHash = crypto
      .createHash('md5')
      .update(biddingContent)
      .digest('hex');
    
    // Als dit de eerste keer is of als er geen vorige hash is opgeslagen
    if (!previousHash) {
      previousHash = currentHash;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Eerste controle uitgevoerd, bidding history hash opgeslagen',
          changed: false,
          hash: currentHash
        })
      };
    }
    
    // Controleer of er wijzigingen zijn
    if (currentHash !== previousHash) {
      // Wijzigingen gedetecteerd
      const oldHash = previousHash;
      previousHash = currentHash;
      
      // Optioneel: Stuur een webhook als iemand handmatig een wijziging detecteert
      if (process.env.WEBHOOK_URL) {
        try {
          await axios.post(process.env.WEBHOOK_URL, {
            event: "bidding_history_changed_manual",
            url: websiteUrl,
            timestamp: new Date().toISOString(),
            message: "Handmatige controle: Wijziging gedetecteerd in de biedingsgeschiedenis!"
          });
        } catch (webhookError) {
          console.error("Webhook error:", webhookError);
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Wijziging gedetecteerd in bidding history!',
          changed: true,
          oldHash,
          newHash: currentHash
        })
      };
    }
    
    // Geen wijzigingen gedetecteerd
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Geen wijzigingen gedetecteerd in bidding history',
        changed: false,
        hash: currentHash
      })
    };
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: `Fout bij het controleren van de bidding history: ${error.message}`
      })
    };
  }
};