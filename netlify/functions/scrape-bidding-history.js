// netlify/functions/scrape-bidding-history.js

const axios = require('axios');
const crypto = require('crypto');
const { schedule } = require('@netlify/functions');

// Hierin slaan we de vorige hash op
let previousHash = '';

// Deze functie haalt de .bidding-history content op en vergelijkt deze
async function checkBiddingHistory(url) {
  try {
    // Haal de volledige pagina op
    const response = await axios.get(url);
    const html = response.data;
    
    // Extraheer de .bidding-history element met een eenvoudige regex
    // Dit is een eenvoudige benadering - voor complexere HTML parsing zou je cheerio kunnen gebruiken
    const biddingHistoryRegex = /<div[^>]*class="[^"]*bidding-history[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    const match = html.match(biddingHistoryRegex);
    
    if (!match || !match[0]) {
      throw new Error("Kon .bidding-history element niet vinden op de pagina");
    }
    
    // Gebruik alleen het gevonden .bidding-history element
    const biddingHistoryContent = match[0];
    
    // Bereken een hash van de content
    const currentHash = crypto
      .createHash('md5')
      .update(biddingHistoryContent)
      .digest('hex');
    
    return { 
      content: biddingHistoryContent,
      hash: currentHash,
      hasChanged: previousHash && currentHash !== previousHash
    };
  } catch (error) {
    console.error("Error checking bidding history:", error);
    throw error;
  }
}

// Functie om een webhook te triggeren
async function triggerWebhook(data) {
  try {
    // Haal de webhook URL uit de environment variabelen
    const webhookUrl = process.env.WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error("WEBHOOK_URL is niet geconfigureerd");
      return false;
    }
    
    // Stuur een bericht naar de webhook
    await axios.post(webhookUrl, {
      event: "bidding_history_changed",
      url: process.env.WEBSITE_URL,
      timestamp: new Date().toISOString(),
      message: "Wijziging gedetecteerd in de biedingsgeschiedenis!"
    });
    
    return true;
  } catch (error) {
    console.error("Error triggering webhook:", error);
    return false;
  }
}

// Handler voor de geplande functie
const handler = async function(event, context) {
  try {
    // Website URL die je wilt scrapen
    const websiteUrl = process.env.WEBSITE_URL;
    
    if (!websiteUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Website URL niet geconfigureerd' })
      };
    }
    
    // Controleer de .bidding-history content
    const result = await checkBiddingHistory(websiteUrl);
    
    // Als dit de eerste keer is
    if (!previousHash) {
      previousHash = result.hash;
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Eerste controle uitgevoerd, hash opgeslagen',
          hash: result.hash
        })
      };
    }
    
    // Controleer of er wijzigingen zijn
    if (result.hasChanged) {
      // Er is een wijziging - trigger de webhook
      const webhookSuccess = await triggerWebhook({
        url: websiteUrl,
        hash: result.hash
      });
      
      // Update de hash
      previousHash = result.hash;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Wijziging gedetecteerd in .bidding-history!',
          webhookSent: webhookSuccess
        })
      };
    }
    
    // Geen wijzigingen
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Geen wijzigingen gedetecteerd in .bidding-history' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Stel de functie in om elke 5 minuten te draaien
// Je kunt dit aanpassen naar '* * * * *' voor elke minuut
exports.handler = schedule('*/5 * * * *', handler);