// netlify/functions/scrape-website.js

const axios = require('axios');
const crypto = require('crypto');
const { schedule } = require('@netlify/functions');

// Hier sla je de vorige versie van de website op voor vergelijking
let previousHash = '';

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
    
    // Haal de website content op
    const response = await axios.get(websiteUrl);
    const content = response.data;
    
    // Bereken een hash van de content
    const currentHash = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');
    
    // Als dit de eerste keer is of als er een wijziging is
    if (!previousHash) {
      previousHash = currentHash;
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Eerste controle uitgevoerd, hash opgeslagen' })
      };
    }
    
    // Controleer of er wijzigingen zijn
    if (currentHash !== previousHash) {
      // Stuur een melding (je kunt hier verschillende methoden gebruiken)
      await sendNotification(websiteUrl);
      
      // Update de hash
      previousHash = currentHash;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Wijziging gedetecteerd! Melding verstuurd.' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Geen wijzigingen gedetecteerd' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Functie om een melding te sturen
async function sendNotification(url) {
  // Hier kun je verschillende meldingsmethoden implementeren
  
  // Optie 1: Email (met bijvoorbeeld SendGrid of andere email service)
  // const emailResult = await sendEmail({
  //   to: 'jouw@email.nl',
  //   subject: 'Website wijziging gedetecteerd!',
  //   body: `Er is een wijziging gedetecteerd op ${url}`
  // });
  
  // Optie 2: Webhook naar een service zoals Slack, Discord, etc.
  // const webhookResult = await axios.post('JOUW_WEBHOOK_URL', {
  //   text: `Er is een wijziging gedetecteerd op ${url} om ${new Date().toLocaleString()}`
  // });
  
  console.log(`Melding verzonden voor wijziging op ${url}`);
}

// Stel de functie in om elk uur te draaien (kun je aanpassen naar wens)
exports.handler = schedule('0 * * * *', handler);