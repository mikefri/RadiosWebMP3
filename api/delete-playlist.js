// api/delete-playlist.js
import { Pool } from '@neondatabase/serverless'; // Assurez-vous d'avoir cette dépendance installée

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'ID de playlist manquant.' });
        }

        try {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
            });

            const result = await pool.query('DELETE FROM playlists WHERE id = $1', [id]);

            if (result.rowCount > 0) {
                res.status(200).json({ success: true, message: 'Playlist supprimée avec succès.' });
            } else {
                res.status(404).json({ success: false, message: 'Playlist non trouvée ou déjà supprimée.' });
            }

            await pool.end();
        } catch (error) {
            console.error('Erreur dans l\'API delete-playlist:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur lors de la suppression de la playlist.' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Méthode non autorisée.' });
    }
}