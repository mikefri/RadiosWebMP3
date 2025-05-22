import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Autorise uniquement les requêtes POST pour sauvegarder
  if (req.method === 'POST') {
    // Extrait le nom et le contenu de la playlist du corps de la requête JSON
    const { name, playlist } = req.body;

    // Vérifie si les données essentielles sont présentes
    if (!name || !playlist) {
      return res.status(400).json({ success: false, message: 'Nom de playlist ou contenu manquant.' });
    }

    try {
      // Insère la playlist dans la table 'playlists'
      // name est une colonne TEXT, content est une colonne JSONB (stocke directement l'objet JSON)
      await sql`
        INSERT INTO playlists (name, content)
        VALUES (${name}, ${JSON.stringify(playlist)})
      `;
      // Renvoie une réponse de succès au frontend
      return res.status(200).json({ success: true, message: 'Playlist sauvegardée.' });
    } catch (error) {
      // Gère les erreurs de base de données
      console.error("Erreur de BDD lors de la sauvegarde :", error);
      return res.status(500).json({ success: false, message: 'Erreur serveur lors de la sauvegarde.' });
    }
  } else {
    // Si la méthode HTTP n'est pas POST, renvoie une erreur 405 (Méthode non autorisée)
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
