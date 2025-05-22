import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Récupère les paramètres 'action' et 'id' de l'URL de la requête
  const { action, id } = req.query;

  // Cas 1 : Lister toutes les playlists disponibles (pour le menu de chargement)
  if (action === 'list') {
    try {
      // Sélectionne l'ID et le nom de toutes les playlists, triées par date de création
      const { rows } = await sql`SELECT id, name FROM playlists ORDER BY created_at DESC`;
      // Renvoie un tableau d'objets [{ id: '...', name: '...' }, ...]
      return res.status(200).json(rows);
    } catch (error) {
      console.error("Erreur de BDD lors du listage :", error);
      return res.status(500).json({ success: false, message: 'Erreur serveur lors du listage.' });
    }
  }
  // Cas 2 : Charger le contenu d'une playlist spécifique par son ID
  else if (action === 'get' && id) {
    try {
      // Sélectionne le nom et le contenu d'une playlist spécifique par son ID
      const { rows } = await sql`SELECT name, content FROM playlists WHERE id = ${id}`;
      if (rows.length === 0) {
        // Si aucune playlist trouvée avec cet ID
        return res.status(404).json({ success: false, message: 'Playlist non trouvée.' });
      }
      // Renvoie le nom et le contenu de la playlist.
      // Le champ 'content' est déjà un objet JavaScript grâce au type JSONB.
      return res.status(200).json({ name: rows[0].name, playlist: rows[0].content });
    } catch (error) {
      console.error(`Erreur de BDD lors du chargement de l'ID ${id}:`, error);
      return res.status(500).json({ success: false, message: 'Erreur serveur lors du chargement.' });
    }
  }
  // Cas 3 : Requête invalide (paramètres manquants ou incorrects)
  else {
    return res.status(400).json({ success: false, message: 'Requête invalide.' });
  }
}
