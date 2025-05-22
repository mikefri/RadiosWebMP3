// api/load-playlists.js
import { Pool } from '@neondatabase/serverless'; // Assurez-vous d'avoir cette dépendance installée

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { action, id } = req.query;

        try {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
            });

            if (action === 'list') {
                // Sélectionne 'content' au lieu de 'playlist'
                const { rows } = await pool.query('SELECT id, name, content FROM playlists ORDER BY name ASC');
                
                // Mappe les résultats pour que la clé reste 'playlist' pour le frontend
                const playlistsForFrontend = rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    playlist: row.content // Renomme 'content' en 'playlist' pour le client
                }));

                res.status(200).json(playlistsForFrontend);
            } else if (action === 'get' && id) {
                // Sélectionne 'content' au lieu de 'playlist'
                const { rows } = await pool.query('SELECT name, content FROM playlists WHERE id = $1', [id]);
                if (rows.length > 0) {
                    // Renomme 'content' en 'playlist' pour le client
                    res.status(200).json({ name: rows[0].name, playlist: rows[0].content });
                } else {
                    res.status(404).json({ success: false, message: 'Playlist non trouvée.' });
                }
            } else {
                res.status(400).json({ success: false, message: 'Action invalide ou ID manquant.' });
            }

            await pool.end();
        } catch (error) {
            console.error('Erreur dans l\'API load-playlists:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur lors du chargement des playlists.' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Méthode non autorisée.' });
    }
}