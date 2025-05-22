// Déclarations des variables globales (vérifiez que tous ces IDs existent dans votre HTML)
const audioPlayer = document.getElementById('audioPlayer');
const playlistElement = document.getElementById('playlist'); // Pour la liste de toutes les chansons
const currentPlaylistElement = document.getElementById('currentPlaylist'); // Pour la playlist actuelle
const currentSongTitleElement = document.getElementById('currentSongTitle');
const searchInput = document.getElementById('searchInput');
const shuffleButton = document.getElementById('shuffleButton');
const savePlaylistButton = document.getElementById('savePlaylistButton');
const loadPlaylistsButton = document.getElementById('loadPlaylistsButton');
const exportCurrentPlaylistButton = document.getElementById('exportCurrentPlaylistButton');
const savedPlaylistsSection = document.getElementById('savedPlaylistsSection');
const savedPlaylistsList = document.getElementById('savedPlaylistsList'); // Pour la liste des playlists sauvegardées
const progressBar = document.getElementById('progressBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');

let allSongs = []; // Contient toutes les chansons disponibles (chargées depuis Synology)
let currentPlaylist = []; // Contient les chansons de la playlist que l'utilisateur a construite ou chargée
let currentSongIndex = -1; // Index de la chanson en cours dans currentPlaylist
let currentPlaylistName = null; // Pour stocker le nom de la playlist chargée depuis la DB

// --- Fonctions de base du lecteur audio et de la gestion locale ---

// Charge la liste de toutes les chansons depuis votre Synology
async function loadSongs() {
    try {
        // !!! ASSUREZ-VOUS QUE CETTE URL EST CORRECTE ET ACCESSIBLE !!!
        const response = await fetch('https://radioswebmp3.synology.me/musique/audios-list.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - Échec du chargement de audios-list.json`);
        }
        const data = await response.json();
        console.log("Contenu JSON reçu:", data); // Pour le débogage: Affiche le JSON brut
        
        // CORRECTION ICI : Votre JSON est un tableau direct, pas un objet avec une propriété 'songs'
        if (Array.isArray(data)) {
            allSongs = data;
        } else {
            // Au cas où la structure changerait ou s'il y a une erreur inattendue
            console.error("La structure du JSON n'est pas un tableau direct:", data);
            alert("Erreur: La liste des chansons n'est pas au format attendu (tableau).");
            return; // Arrêter l'exécution si le format est incorrect
        }
        
        console.log("allSongs après assignation:", allSongs); // Pour le débogage: Affiche le tableau allSongs

        displayAllSongs();
    } catch (error) {
        console.error('Erreur lors du chargement des chansons:', error);
        alert('Impossible de charger la liste des chansons depuis Synology. Vérifiez l\'URL et votre réseau.');
    }
}

// Affiche toutes les chansons disponibles dans la section "Liste des Chansons"
function displayAllSongs() {
    playlistElement.innerHTML = '';
    // Assurez-vous que allSongs est bien un tableau avant d'appeler forEach
    if (!Array.isArray(allSongs) || allSongs.length === 0) {
        playlistElement.innerHTML = '<li class="empty-list">Aucune chanson à afficher.</li>';
        return;
    }

    allSongs.forEach((song, index) => {
        const listItem = document.createElement('li');
        // Utilisation de song.path pour le lecteur
        // Vérification de l'existence des propriétés pour éviter les erreurs
        const title = song.title || 'Titre inconnu';
        const artist = song.artist || 'Artiste inconnu';

        listItem.innerHTML = `
            <div class="song-info">
                <span class="song-title">${title}</span> - <span class="song-artist">${artist}</span>
            </div>
            <div class="song-actions">
                <span class="add-to-playlist" data-index="${index}" title="Ajouter à la playlist actuelle"><i class="fas fa-plus-circle"></i></span>
                <span class="play-now" data-index="${index}" title="Jouer maintenant"><i class="fas fa-play-circle"></i></span>
            </div>
        `;
        playlistElement.appendChild(listItem);
    });
}

// Ajoute une chanson à la playlist actuelle en mémoire
function addSongToCurrentPlaylist(song) {
    currentPlaylist.push(song);
    updateCurrentPlaylistDisplay();
}

// Met à jour l'affichage de la playlist actuelle dans le HTML
function updateCurrentPlaylistDisplay() {
    currentPlaylistElement.innerHTML = '';
    if (currentPlaylist.length === 0) {
        currentPlaylistElement.innerHTML = '<li class="empty-playlist">Votre playlist est vide. Ajoutez des chansons !</li>';
        currentSongTitleElement.textContent = 'Aucune chanson en cours';
        document.title = 'MP3 - RadiosWeb';
        return;
    }
    currentPlaylist.forEach((song, index) => {
        const listItem = document.createElement('li');
        const title = song.title || 'Titre inconnu';
        const artist = song.artist || 'Artiste inconnu';

        listItem.innerHTML = `
            <div class="song-info">
                <span class="song-title">${title}</span> - <span class="song-artist">${artist}</span>
            </div>
            <div class="song-actions">
                <span class="play-current" data-index="${index}" title="Jouer"><i class="fas fa-play-circle"></i></span>
                <span class="remove-from-playlist" data-index="${index}" title="Supprimer de la playlist"><i class="fas fa-minus-circle"></i></span>
            </div>
        `;
        // Surligne la chanson en cours de lecture
        if (index === currentSongIndex) {
            listItem.classList.add('playing');
        }
        currentPlaylistElement.appendChild(listItem);
    });
    // Fait défiler jusqu'à la chanson en cours si elle est en train de jouer
    const playingElement = currentPlaylistElement.querySelector('.playing');
    if (playingElement) {
        playingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Lance la lecture d'une chanson spécifique
function playSong(song, index) {
    if (!song || !song.path) { // Vérifie si la chanson ou son chemin est valide
        console.error("Chanson invalide ou chemin manquant:", song);
        alert("Impossible de lire cette chanson. Le chemin du fichier est manquant.");
        return;
    }
    audioPlayer.src = song.path; // Utilise 'path' comme dans votre JSON
    currentSongIndex = index;
    currentSongTitleElement.textContent = `${song.title || 'Titre inconnu'} - ${song.artist || 'Artiste inconnu'}`;
    document.title = `${song.title || 'Titre inconnu'} - ${song.artist || 'Artiste inconnu'}`;
    audioPlayer.play();
    updateCurrentPlaylistDisplay(); // Met à jour l'affichage pour surligner
}

// Passe à la chanson suivante dans la playlist actuelle
function playNextSong() {
    if (currentPlaylist.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    playSong(currentPlaylist[currentSongIndex], currentSongIndex);
}

// Passe à la chanson précédente dans la playlist actuelle
function playPreviousSong() {
    if (currentPlaylist.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSong(currentPlaylist[currentSongIndex], currentSongIndex);
}

// Mélange la playlist actuelle
function shufflePlaylist() {
    if (currentPlaylist.length <= 1) {
        alert('La playlist doit contenir au moins deux chansons pour être mélangée.');
        return;
    }
    for (let i = currentPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentPlaylist[i], currentPlaylist[j]] = [currentPlaylist[j], currentPlaylist[i]];
    }
    currentSongIndex = -1; // Réinitialise l'index après le mélange
    updateCurrentPlaylistDisplay();
    alert('Playlist mélangée !');
}

// Fonction de recherche de chansons
function searchSongs() {
    const searchTerm = searchInput.value.toLowerCase();
    playlistElement.innerHTML = '';
    
    // Assurez-vous que allSongs est un tableau valide avant de filtrer
    if (!Array.isArray(allSongs) || allSongs.length === 0) {
        playlistElement.innerHTML = '<li class="empty-list">Aucune chanson disponible pour la recherche.</li>';
        return;
    }

    const filteredSongs = allSongs.filter(song =>
        (song.title && song.title.toLowerCase().includes(searchTerm)) || 
        (song.artist && song.artist.toLowerCase().includes(searchTerm))
    );

    if (filteredSongs.length === 0) {
        playlistElement.innerHTML = '<li class="empty-list">Aucun résultat trouvé.</li>';
        return;
    }

    filteredSongs.forEach((song, index) => {
        const listItem = document.createElement('li');
        // Trouver l'index original de la chanson dans allSongs pour les actions
        // Utilisation de song.path comme identifiant unique
        const originalIndex = allSongs.findIndex(s => s.path === song.path); 
        if (originalIndex === -1) return; // Si la chanson n'est pas trouvée dans allSongs, ne pas l'afficher (cas rare)

        const title = song.title || 'Titre inconnu';
        const artist = song.artist || 'Artiste inconnu';

        listItem.innerHTML = `
            <div class="song-info">
                <span class="song-title">${title}</span> - <span class="song-artist">${artist}</span>
            </div>
            <div class="song-actions">
                <span class="add-to-playlist" data-index="${originalIndex}" title="Ajouter à la playlist actuelle"><i class="fas fa-plus-circle"></i></span>
                <span class="play-now" data-index="${originalIndex}" title="Jouer maintenant"><i class="fas fa-play-circle"></i></span>
            </div>
        `;
        playlistElement.appendChild(listItem);
    });
}

// Exporte la playlist actuelle dans un fichier JSON téléchargeable
function exportCurrentPlaylist() {
    if (currentPlaylist.length === 0) {
        alert("La playlist actuelle est vide. Impossible d'exporter.");
        return;
    }
    const jsonString = JSON.stringify(currentPlaylist, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = currentPlaylistName ? `${currentPlaylistName}.json` : 'playlist_export.json';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`Playlist exportée sous le nom ${filename} !`);
}

// Fonction pour formater le temps (secondes en MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}


// --- Fonctions de gestion des playlists avec Vercel/Neon ---

// Sauvegarde la playlist actuelle dans la base de données via l'API Vercel
async function savePlaylistOnVercel() {
    if (currentPlaylist.length === 0) {
        alert("Votre playlist actuelle est vide. Ajoutez des chansons avant de la sauvegarder.");
        return;
    }
    const playlistName = prompt("Nommez votre playlist :");
    if (playlistName) {
        try {
            const response = await fetch('/api/save-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: playlistName, playlist: currentPlaylist }),
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert("Playlist sauvegardée sur Vercel !");
                loadSavedPlaylistsFromVercel(); // Rafraîchit la liste des playlists après sauvegarde
            } else {
                throw new Error(result.message || `Erreur lors de la sauvegarde: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Erreur lors de la sauvegarde :", error);
            alert("Impossible de sauvegarder la playlist. Détails : " + error.message);
        }
    }
}

// Charge la liste des playlists sauvegardées depuis la base de données via l'API Vercel
async function loadSavedPlaylistsFromVercel() {
    // Vérifier si savedPlaylistsList existe avant de manipuler innerHTML
    if (savedPlaylistsList) {
        savedPlaylistsList.innerHTML = ''; // Nettoie la liste affichée
    } else {
        console.warn("L'élément 'savedPlaylistsList' n'a pas été trouvé. Assurez-vous que l'ID est correct dans votre HTML.");
        // Gérer le cas où l'élément n'existe pas, peut-être ne pas afficher la section
        if (savedPlaylistsSection) {
            savedPlaylistsSection.style.display = 'none';
        }
        return;
    }

    try {
        const response = await fetch('/api/load-playlists?action=list');
        if (!response.ok) {
            throw new Error(`Échec du chargement de la liste des playlists: ${response.status} ${response.statusText}`);
        }

        const savedPlaylists = await response.json();

        if (savedPlaylists.length > 0) {
            savedPlaylists.forEach(pl => {
                const listItem = document.createElement('li');

                const bullet = document.createElement('span');
                bullet.classList.add('playlist-bullet');
                listItem.appendChild(bullet);

                const playlistNameSpan = document.createElement('span');
                playlistNameSpan.textContent = pl.name;
                // Quand on clique sur le nom, on charge la playlist par son ID
                playlistNameSpan.addEventListener('click', () => loadPlaylistFromVercel(pl.id));
                listItem.appendChild(playlistNameSpan);

                const deleteIcon = document.createElement('span');
                deleteIcon.classList.add('delete-icon');
                deleteIcon.innerHTML = '<i class="fas fa-trash"></i>'; // Ajout d'une icône de suppression
                // Empêche que le clic sur l'icône de suppression ne déclenche aussi le chargement de la playlist
                deleteIcon.addEventListener('click', (event) => {
                    event.stopPropagation();
                    deletePlaylistOnVercel(pl.id, pl.name); // Supprime par l'ID et nom pour confirmation
                });
                listItem.appendChild(deleteIcon);
                savedPlaylistsList.appendChild(listItem);
            });
            if (savedPlaylistsSection) {
                savedPlaylistsSection.style.display = 'block'; // Affiche la section si des playlists existent
            }
        } else {
            if (savedPlaylistsSection) {
                savedPlaylistsSection.style.display = 'none'; // Cache si aucune playlist sauvegardée
            }
        }
    } catch (error) {
        console.error("Erreur lors du chargement des playlists depuis Vercel:", error);
        if (savedPlaylistsSection) {
            savedPlaylistsSection.style.display = 'none'; // Cache la section en cas d'erreur aussi
        }
        alert("Impossible de charger les playlists. Détails : " + error.message);
    }
}

// Charge le contenu d'une playlist spécifique depuis la base de données via l'API Vercel
async function loadPlaylistFromVercel(playlistId) {
    try {
        const response = await fetch(`/api/load-playlists?action=get&id=${playlistId}`);
        if (!response.ok) {
            throw new Error(`Échec du chargement du contenu de la playlist: ${response.status} ${response.statusText}`);
        }

        const playlistData = await response.json(); // Récupère { name: "Nom", playlist: [...] }
        currentPlaylist = playlistData.playlist; // Met à jour la playlist actuellement chargée
        updateCurrentPlaylistDisplay(); // Met à jour l'affichage
        currentPlaylistName = playlistData.name; // Met à jour le nom de la playlist actuelle
        alert(`Playlist "${playlistData.name}" chargée !`);
        // Passer à l'onglet "Playlist Actuelle" après le chargement
        document.querySelector('.tab-button[data-tab="current-playlist-section"]').click();
    } catch (error) {
        console.error(`Erreur lors du chargement de la playlist ${playlistId} depuis Vercel:`, error);
        alert(`Impossible de charger la playlist. Détails : ` + error.message);
    }
}

// Supprime une playlist de la base de données via l'API Vercel
async function deletePlaylistOnVercel(playlistId, playlistName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la playlist "${playlistName}" ?`)) {
        try {
            const response = await fetch('/api/delete-playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: playlistId }),
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert(`Playlist "${playlistName}" supprimée.`);
                loadSavedPlaylistsFromVercel(); // Rafraîchit la liste après suppression

                // Si la playlist supprimée était la playlist actuellement chargée, réinitialiser
                if (currentPlaylistName === playlistName) {
                    currentPlaylist = [];
                    updateCurrentPlaylistDisplay();
                    audioPlayer.pause();
                    audioPlayer.src = '';
                    currentSongTitleElement.textContent = 'Aucune chanson en cours';
                    document.title = 'MP3 - RadiosWeb';
                    currentPlaylistName = null;
                    currentSongIndex = -1; // Réinitialiser l'index
                }
            } else {
                throw new Error(result.message || `Erreur lors de la suppression: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            alert("Impossible de supprimer la playlist. Détails : " + error.message);
        }
    }
}


// --- Gestionnaire d'événements DOMContentLoaded (appelé au chargement de la page) ---
document.addEventListener('DOMContentLoaded', () => {
    loadSongs(); // Charge toutes les chansons disponibles au démarrage
    loadSavedPlaylistsFromVercel(); // Charge les playlists sauvegardées depuis Neon au démarrage

    // Délégation d'événements pour la liste de toutes les chansons
    if (playlistElement) { // Vérifie si l'élément existe
        playlistElement.addEventListener('click', (event) => {
            const target = event.target.closest('span');
            if (!target) return;

            const listItem = target.closest('li');
            if (!listItem) return;

            const originalIndex = parseInt(target.dataset.index);
            if (isNaN(originalIndex) || originalIndex < 0 || originalIndex >= allSongs.length) return;

            const song = allSongs[originalIndex];

            if (target.classList.contains('add-to-playlist')) {
                addSongToCurrentPlaylist(song);
            } else if (target.classList.contains('play-now')) {
                currentPlaylist = [song]; // Crée une playlist d'une seule chanson pour "jouer maintenant"
                playSong(song, 0);
                // Bascule vers l'onglet playlist actuelle si le bouton existe
                const currentPlaylistTabButton = document.querySelector('.tab-button[data-tab="current-playlist-section"]');
                if (currentPlaylistTabButton) {
                    currentPlaylistTabButton.click();
                }
            }
        });
    }

    // Délégation d'événements pour la playlist actuelle
    if (currentPlaylistElement) { // Vérifie si l'élément existe
        currentPlaylistElement.addEventListener('click', (event) => {
            const target = event.target.closest('span');
            if (!target) return;

            const listItem = target.closest('li');
            if (!listItem) return;

            const index = parseInt(target.dataset.index);
            if (isNaN(index) || index < 0 || index >= currentPlaylist.length) return;

            if (target.classList.contains('play-current')) {
                playSong(currentPlaylist[index], index);
            } else if (target.classList.contains('remove-from-playlist')) {
                // Supprime la chanson de la playlist
                currentPlaylist.splice(index, 1);
                // Ajuste l'index de la chanson en cours si nécessaire
                if (index < currentSongIndex) {
                    currentSongIndex--;
                } else if (index === currentSongIndex) {
                    // Si la chanson supprimée est celle qui était en cours, arrête la lecture
                    audioPlayer.pause();
                    audioPlayer.src = '';
                    currentSongTitleElement.textContent = 'Aucune chanson en cours';
                    document.title = 'MP3 - RadiosWeb';
                    currentSongIndex = -1; // Réinitialise l'index
                }
                updateCurrentPlaylistDisplay();
            }
        });
    }

    // Écouteurs d'événements pour le lecteur audio
    if (audioPlayer) { // Vérifie si l'élément existe
        audioPlayer.addEventListener('ended', playNextSong); // Joue la chanson suivante quand la précédente est terminée

        // Mise à jour de la barre de progression et du temps
        audioPlayer.addEventListener('timeupdate', () => {
            const current = audioPlayer.currentTime;
            const duration = audioPlayer.duration;

            if (isNaN(duration)) { // Si la durée n'est pas encore disponible
                if (progressBar) progressBar.value = 0;
                if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
                if (durationSpan) durationSpan.textContent = '0:00';
            } else {
                if (progressBar) progressBar.value = (current / duration) * 100;
                if (currentTimeSpan) currentTimeSpan.textContent = formatTime(current);
                if (durationSpan) durationSpan.textContent = formatTime(duration);
            }
        });

        // Gère le déplacement du curseur de la barre de progression
        if (progressBar) { // Vérifie si l'élément existe
            progressBar.addEventListener('input', () => {
                const time = (progressBar.value * audioPlayer.duration) / 100;
                audioPlayer.currentTime = time;
            });
        }
    }

    // Association des boutons de contrôle (Précédent/Suivant)
    // Ces boutons sont créés dynamiquement, assurez-vous que l'endroit où ils sont ajoutés existe.
    const audioPlayerDiv = document.querySelector('.audio-player');
    if (audioPlayerDiv) { // Vérifie si la div existe pour ajouter les boutons
        const previousButton = document.createElement('button');
        previousButton.id = 'previousButton';
        previousButton.classList.add('controls-button');
        previousButton.innerHTML = '<i class="fas fa-backward"></i> Précédent';
        previousButton.addEventListener('click', playPreviousSong);
        audioPlayerDiv.appendChild(previousButton);

        const nextButton = document.createElement('button');
        nextButton.id = 'nextButton';
        nextButton.classList.add('controls-button');
        nextButton.innerHTML = 'Suivant <i class="fas fa-forward"></i>';
        nextButton.addEventListener('click', playNextSong);
        audioPlayerDiv.appendChild(nextButton);
    }


    // Association des écouteurs pour la recherche et le mélange
    if (searchInput) { // Vérifie si l'élément existe
        searchInput.addEventListener('input', searchSongs);
    }
    if (shuffleButton) { // Vérifie si l'élément existe
        shuffleButton.addEventListener('click', shufflePlaylist);
    }

    // Association des boutons de sauvegarde/chargement/export avec les nouvelles fonctions
    if (savePlaylistButton) { // Vérifie si l'élément existe
        savePlaylistButton.addEventListener('click', savePlaylistOnVercel);
    }
    if (loadPlaylistsButton) { // Vérifie si l'élément existe
        loadPlaylistsButton.addEventListener('click', loadSavedPlaylistsFromVercel);
    }
    if (exportCurrentPlaylistButton) { // Vérifie si l'élément existe
        exportCurrentPlaylistButton.addEventListener('click', exportCurrentPlaylist);
    }

    // Gestion des onglets (copié de votre HTML)
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            // Enlever la classe 'active' de tous les boutons et contenus
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

            // Ajouter la classe 'active' au bouton cliqué
            button.classList.add('active');

            // Afficher le contenu de l'onglet correspondant
            const targetTabContent = document.getElementById(tabId);
            if (targetTabContent) {
                targetTabContent.style.display = 'block';
            }

            // Si c'est l'onglet "Playlist Actuelle" et que le bouton charger est celui qui a déclenché le changement,
            // ou si on clique juste sur l'onglet "Playlist Actuelle", recharger les playlists sauvegardées
            // (Assure que la liste des playlists sauvegardées est toujours à jour)
            if (tabId === 'current-playlist-section') {
                loadSavedPlaylistsFromVercel();
            }
        });
    });

    // Activation de l'onglet "Liste des Chansons" par défaut au chargement
    const defaultTabButton = document.querySelector('.tab-button[data-tab="playlist-section"]');
    if (defaultTabButton) {
        defaultTabButton.click();
    }
});