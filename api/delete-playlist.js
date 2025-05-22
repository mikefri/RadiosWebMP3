import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Autorise uniquement les requêtes POST pour la suppression (peut être DELETE aussi)
  if (req.method === 'POST') {
    // Extrait l'ID de la playlist à supprimer du corps de la requête JSON
    const { id } = req.body;

    // Vérifie si l'ID est présent
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID de playlist manquant.' });
    }

    try {
      // Supprime la playlist de la table par son ID
      await sql`DELETE FROM playlists WHERE id = ${id}`;
      // Renvoie une réponse de succès
      return res.status(200).json({ success: true, message: 'Playlist supprimée.' });
    } catch (error) {
      console.error("Erreur de BDD lors de la suppression :", error);
      return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression.' });
    }
  } else {
    // Méthode non autorisée
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
