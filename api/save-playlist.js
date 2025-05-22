// api/save-playlist.js
import { Pool } from '@neondatabase/serverless'; // Assurez-vous d'avoir cette dépendance installée

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { name, playlist } = req.body;

        if (!name || !playlist) {
            return res.status(400).json({ success: false, message: 'Nom de playlist ou contenu manquant.' });
        }

        try {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
            });

            // Vérifier si une playlist avec ce nom existe déjà
            const checkResult = await pool.query('SELECT id FROM playlists WHERE name = $1', [name]);

            if (checkResult.rows.length > 0) {
                // Si la playlist existe, la mettre à jour (UPDATE)
                await pool.query(
                    'UPDATE playlists SET content = $1, created_at = NOW() WHERE name = $2',
                    [JSON.stringify(playlist), name] // Utilise 'content' ici
                );
                res.status(200).json({ success: true, message: 'Playlist mise à jour avec succès.' });
            } else {
                // Sinon, insérer une nouvelle playlist (INSERT)
                await pool.query(
                    'INSERT INTO playlists (name, content) VALUES ($1, $2)',
                    [name, JSON.stringify(playlist)] // Utilise 'content' ici
                );
                res.status(201).json({ success: true, message: 'Playlist sauvegardée avec succès.' });
            }

            await pool.end();
        } catch (error) {
            console.error('Erreur dans l\'API save-playlist:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur lors de la sauvegarde de la playlist.' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Méthode non autorisée.' });
    }
}