export default async function handler(req, res) {
    // Activer CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  
    // Répondre aux requêtes OPTIONS pour les pre-flight CORS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const webhookUrl = process.env.MAKE_WEBHOOK;
      
      if (!webhookUrl) {
        console.error("Make webhook URL not configured in environment variables");
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      // Envoi des données au webhook Make
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send data to webhook:", errorText);
        return res.status(response.status).json({ 
          error: 'Failed to process trip data',
          details: errorText
        });
      }
      
      const responseData = await response.json().catch(() => ({}));
      return res.status(200).json({ 
        success: true,
        ...responseData
      });
    } catch (error) {
      console.error("Error processing trip:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
}