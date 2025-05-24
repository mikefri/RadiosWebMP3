// Déclarations des variables globales
const audioPlayer = document.getElementById('audioPlayer');
const playlistElement = document.getElementById('playlist'); // Pour la liste de toutes les chansons
const currentPlaylistElement = document.getElementById('currentPlaylist'); // Pour la playlist actuelle
const currentSongTitleElement = document.getElementById('currentSongTitle');
const searchInput = document.getElementById('searchInput');
const shuffleButton = document.getElementById('shuffleButton');
const savePlaylistButton = document.getElementById('savePlaylistButton');
const loadPlaylistsButton = document.getElementById('loadPlaylistsButton');
// const exportCurrentPlaylistButton = document.getElementById('exportCurrentPlaylistButton'); // Cet ID n'existe pas dans le HTML fourni
const savedPlaylistsSection = document.getElementById('savedPlaylistsSection');
const savedPlaylistsList = document.getElementById('savedPlaylistsList'); // Pour la liste des playlists sauvegardées
const progressBar = document.getElementById('progressBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');

// Assurez-vous que ces IDs existent dans votre HTML pour les boutons Précédent/Suivant
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');


let allSongs = []; // Contient toutes les chansons disponibles (chargées depuis Synology)
let currentPlaylist = []; // Contient les chansons de la playlist que l'utilisateur a construite ou chargée
let currentSongIndex = -1; // Index de la chanson en cours dans currentPlaylist
let currentPlaylistName = null; // Pour stocker le nom de la playlist chargée depuis la DB
let isShuffleMode = false; // Nouvelle variable pour l'état du mode aléatoire

// --- Fonctions de base du lecteur audio et de la gestion locale ---

// Charge la liste de toutes les chansons depuis votre Synology
async function loadSongs() {
    try {
        const response = await fetch('https://radioswebmp3.synology.me/musique/audios-list.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - Échec du chargement de audios-list.json`);
        }
        const data = await response.json();
        console.log("Contenu JSON reçu:", data);

        if (Array.isArray(data)) {
            allSongs = data;
        } else {
            console.error("La structure du JSON n'est pas un tableau direct:", data);
            alert("Erreur: La liste des chansons n'est pas au format attendu (tableau).");
            return;
        }

        console.log("allSongs après assignation:", allSongs);
        displayAllSongs();
    } catch (error) {
        console.error('Erreur lors du chargement des chansons:', error);
        alert('Impossible de charger la liste des chansons depuis Synology. Vérifiez l\'URL et votre réseau.');
    }
}

// Affiche toutes les chansons disponibles dans la section "Liste des Chansons"
function displayAllSongs() {
    if (!playlistElement) {
        console.error("L'élément 'playlist' n'a pas été trouvé.");
        return;
    }
    playlistElement.innerHTML = '';

    if (!Array.isArray(allSongs) || allSongs.length === 0) {
        playlistElement.innerHTML = '<li class="empty-list">Aucune chanson à afficher.</li>';
        return;
    }

    allSongs.forEach((song, index) => {
        const listItem = document.createElement('li');
        const title = song.title || 'Titre inconnu';
        const artist = song.artist || 'Artiste inconnu';

        // Utilisation de la nouvelle structure HTML avec les spans et divs pour les icônes
        listItem.innerHTML = `
            <span class="song-title-artist">${title} - ${artist}</span>
            <div class="list-item-icons">
                <i class="fas fa-plus-circle add-to-playlist-icon" data-original-index="${index}" title="Ajouter à la playlist actuelle"></i>
                <i class="fas fa-play-circle play-song-icon" data-original-index="${index}" title="Écouter cette chanson"></i>
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
    if (!currentPlaylistElement) {
        console.error("L'élément 'currentPlaylist' n'a pas été trouvé.");
        return;
    }
    currentPlaylistElement.innerHTML = '';

    if (currentPlaylist.length === 0) {
        currentPlaylistElement.innerHTML = '<li class="empty-playlist">Votre playlist est vide. Ajoutez des chansons !</li>';
        if (currentSongTitleElement) currentSongTitleElement.textContent = 'Aucune chanson en cours';
        document.title = 'MP3 - RadiosWeb';
        return;
    }

    currentPlaylist.forEach((song, index) => {
        const listItem = document.createElement('li');
        const title = song.title || 'Titre inconnu';
        const artist = song.artist || 'Artiste inconnu';

        // Utilisation de la nouvelle structure HTML
        listItem.innerHTML = `
            <span class="song-title-artist">${title} - ${artist}</span>
            <div class="list-item-icons">
                <i class="fas fa-play-circle play-song-icon" data-playlist-index="${index}" title="Jouer cette chanson"></i>
                <i class="fas fa-trash delete-song-icon" data-playlist-index="${index}" title="Supprimer de la playlist"></i>
            </div>
        `;
        
        // Ajout de la classe `current-song-playing` si c'est la chanson actuelle
        if (index === currentSongIndex) {
            listItem.classList.add('current-song-playing');
        }
        currentPlaylistElement.appendChild(listItem);
    });

    // Fait défiler jusqu'à la chanson en cours si elle est en train de jouer
    const playingElement = currentPlaylistElement.querySelector('.current-song-playing');
    if (playingElement) {
        playingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Lance la lecture d'une chanson spécifique
function playSong(song, indexInCurrentPlaylist) {
    if (!song || !song.path) {
        console.error("Chanson invalide ou chemin manquant:", song);
        alert("Impossible de lire cette chanson. Le chemin du fichier est manquant.");
        return;
    }
    
    // Supprime la classe de la chanson précédemment jouée (si elle existe)
    const previouslyPlaying = currentPlaylistElement.querySelector('.current-song-playing');
    if (previouslyPlaying) {
        previouslyPlaying.classList.remove('current-song-playing');
    }

    audioPlayer.src = song.path;
    currentSongIndex = indexInCurrentPlaylist; // Met à jour l'index de la chanson en cours
    
    // Ajoute la classe à la nouvelle chanson en cours de lecture
    const newPlayingElement = currentPlaylistElement.children[currentSongIndex];
    if (newPlayingElement) {
        newPlayingElement.classList.add('current-song-playing');
        newPlayingElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); // S'assurer qu'elle est visible
    }

    if (currentSongTitleElement) currentSongTitleElement.textContent = `${song.title || 'Titre inconnu'} - ${song.artist || 'Artiste inconnu'}`;
    document.title = `${song.title || 'Titre inconnu'} - ${song.artist || 'Artiste inconnu'}`;
    audioPlayer.play();
}

// Passe à la chanson suivante dans la playlist actuelle
function playNextSong() {
    if (currentPlaylist.length === 0) return;

    if (isShuffleMode) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * currentPlaylist.length);
        } while (newIndex === currentSongIndex && currentPlaylist.length > 1); // Évite de rejouer la même si plus d'une chanson
        currentSongIndex = newIndex;
    } else {
        currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    }
    playSong(currentPlaylist[currentSongIndex], currentSongIndex);
}

// Passe à la chanson précédente dans la playlist actuelle
function playPreviousSong() {
    if (currentPlaylist.length === 0) return;

    if (isShuffleMode) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * currentPlaylist.length);
        } while (newIndex === currentSongIndex && currentPlaylist.length > 1);
        currentSongIndex = newIndex;
    } else {
        currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    }
    playSong(currentPlaylist[currentSongIndex], currentSongIndex);
}

// Mélange la playlist actuelle
function toggleShuffle() {
    isShuffleMode = !isShuffleMode;
    if (shuffleButton) {
        shuffleButton.classList.toggle('active', isShuffleMode); // Ajoute/retire une classe 'active' pour le style
        if (isShuffleMode) {
            //alert('Lecture aléatoire activée !');
        } else {
            //alert('Lecture aléatoire désactivée.');
        }
    }
    // Si vous voulez remélanger la playlist affichée quand on active/désactive le shuffle
    // if (isShuffleMode && currentPlaylist.length > 1) {
    //     shufflePlaylistLogic(); // Une fonction pour mélanger la liste si nécessaire
    // }
}


// Fonction de recherche de chansons
function searchSongs() {
    const searchTerm = searchInput.value.toLowerCase();
    playlistElement.innerHTML = '';

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

    filteredSongs.forEach((song) => {
        const listItem = document.createElement('li');
        // Trouver l'index original de la chanson dans allSongs pour les actions
        const originalIndex = allSongs.findIndex(s => s.path === song.path);
        if (originalIndex === -1) return;

        const title = song.title || 'Titre inconnu';
        const artist = song.artist || 'Artiste inconnu';

        listItem.innerHTML = `
            <span class="song-title-artist">${title} - ${artist}</span>
            <div class="list-item-icons">
                <i class="fas fa-plus-circle add-to-playlist-icon" data-original-index="${originalIndex}" title="Ajouter à la playlist actuelle"></i>
                <i class="fas fa-play-circle play-song-icon" data-original-index="${originalIndex}" title="Écouter cette chanson"></i>
            </div>
        `;
        playlistElement.appendChild(listItem);
    });
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
                alert("Playlist sauvegardée !");
                loadSavedPlaylistsFromVercel();
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
    if (savedPlaylistsList) {
        savedPlaylistsList.innerHTML = '';
    } else {
        console.warn("L'élément 'savedPlaylistsList' n'a pas été trouvé. Assurez-vous que l'ID est correct dans votre HTML.");
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

                listItem.innerHTML = `
                    <span class="playlist-bullet"></span>
                    <span class="song-title-artist">${pl.name}</span>
                    <div class="list-item-icons">
                        <i class="fas fa-folder-open load-saved-playlist-icon" data-playlist-id="${pl.id}" title="Charger cette playlist"></i>
                        <i class="fas fa-trash delete-saved-playlist-icon" data-playlist-id="${pl.id}" data-playlist-name="${pl.name}" title="Supprimer cette playlist"></i>
                    </div>
                `;
                savedPlaylistsList.appendChild(listItem);
            });
            if (savedPlaylistsSection) {
                savedPlaylistsSection.style.display = 'block';
            }
        } else {
            if (savedPlaylistsSection) {
                savedPlaylistsSection.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Erreur lors du chargement des playlists depuis Vercel:", error);
        if (savedPlaylistsSection) {
            savedPlaylistsSection.style.display = 'none';
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

        const playlistData = await response.json();
        currentPlaylist = playlistData.playlist;
        updateCurrentPlaylistDisplay();
        currentPlaylistName = playlistData.name;
        // alert(`Playlist "${playlistData.name}" chargée !`); // Décommentez si vous voulez l'alerte

        // Passer à l'onglet "Playlist Actuelle" après le chargement
        const currentPlaylistTabButton = document.querySelector('.tab-button[data-tab="current-playlist-section"]');
        if (currentPlaylistTabButton) {
            currentPlaylistTabButton.click();
        }
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
                loadSavedPlaylistsFromVercel();

                if (currentPlaylistName === playlistName) {
                    currentPlaylist = [];
                    updateCurrentPlaylistDisplay();
                    if (audioPlayer) {
                        audioPlayer.pause();
                        audioPlayer.src = '';
                    }
                    if (currentSongTitleElement) currentSongTitleElement.textContent = 'Aucune chanson en cours';
                    document.title = 'MP3 - RadiosWeb';
                    currentPlaylistName = null;
                    currentSongIndex = -1;
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
    loadSongs();
    loadSavedPlaylistsFromVercel();

    // Délégation d'événements pour la liste de toutes les chansons
    if (playlistElement) {
        playlistElement.addEventListener('click', (event) => {
            const target = event.target; // L'élément sur lequel on a cliqué
            const listItem = target.closest('li');

            if (!listItem) return;

            // Utiliser les classes spécifiques des icônes
            if (target.classList.contains('add-to-playlist-icon')) {
                const originalIndex = parseInt(target.dataset.originalIndex);
                if (!isNaN(originalIndex) && allSongs[originalIndex]) {
                    addSongToCurrentPlaylist(allSongs[originalIndex]);
                }
            } else if (target.classList.contains('play-song-icon')) {
                const originalIndex = parseInt(target.dataset.originalIndex);
                if (!isNaN(originalIndex) && allSongs[originalIndex]) {
                    currentPlaylist = [allSongs[originalIndex]]; // Crée une playlist d'une seule chanson
                    playSong(allSongs[originalIndex], 0);
                    const currentPlaylistTabButton = document.querySelector('.tab-button[data-tab="current-playlist-section"]');
                    if (currentPlaylistTabButton) {
                        currentPlaylistTabButton.click();
                    }
                }
            }
        });
    }

    // Délégation d'événements pour la playlist actuelle
    if (currentPlaylistElement) {
        currentPlaylistElement.addEventListener('click', (event) => {
            const target = event.target;
            const listItem = target.closest('li');

            if (!listItem) return;

            const playlistIndex = parseInt(target.dataset.playlistIndex);
            if (isNaN(playlistIndex) || playlistIndex < 0 || playlistIndex >= currentPlaylist.length) return;

            if (target.classList.contains('play-song-icon')) {
                playSong(currentPlaylist[playlistIndex], playlistIndex);
            } else if (target.classList.contains('delete-song-icon')) {
                // Supprime la chanson de la playlist
                currentPlaylist.splice(playlistIndex, 1);
                // Ajuste l'index de la chanson en cours si nécessaire
                if (playlistIndex < currentSongIndex) {
                    currentSongIndex--;
                } else if (playlistIndex === currentSongIndex) {
                    // Si la chanson supprimée est celle qui était en cours, arrête la lecture
                    audioPlayer.pause();
                    audioPlayer.src = '';
                    if (currentSongTitleElement) currentSongTitleElement.textContent = 'Aucune chanson en cours';
                    document.title = 'MP3 - RadiosWeb';
                    currentSongIndex = -1; // Réinitialise l'index
                }
                updateCurrentPlaylistDisplay();
            }
        });
    }

    // Délégation d'événements pour les playlists sauvegardées (chargement et suppression)
    if (savedPlaylistsList) {
        savedPlaylistsList.addEventListener('click', (event) => {
            const target = event.target;
            const listItem = target.closest('li');

            if (!listItem) return;

            if (target.classList.contains('load-saved-playlist-icon')) {
                const playlistId = target.dataset.playlistId;
                if (playlistId) {
                    loadPlaylistFromVercel(playlistId);
                }
            } else if (target.classList.contains('delete-saved-playlist-icon')) {
                const playlistId = target.dataset.playlistId;
                const playlistName = target.dataset.playlistName;
                if (playlistId && playlistName) {
                    deletePlaylistOnVercel(playlistId, playlistName);
                }
            }
            // Si le clic est sur le nom de la playlist (span.song-title-artist)
            else if (target.classList.contains('song-title-artist') && target.closest('li') === listItem) {
                const loadIcon = listItem.querySelector('.load-saved-playlist-icon');
                if (loadIcon) {
                    const playlistId = loadIcon.dataset.playlistId;
                    if (playlistId) {
                        loadPlaylistFromVercel(playlistId);
                    }
                }
            }
        });
    }


    // Écouteurs d'événements pour le lecteur audio
    if (audioPlayer) {
        audioPlayer.addEventListener('ended', playNextSong);

        audioPlayer.addEventListener('timeupdate', () => {
            const current = audioPlayer.currentTime;
            const duration = audioPlayer.duration;

            if (isNaN(duration)) {
                if (progressBar) progressBar.value = 0;
                if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
                if (durationSpan) durationSpan.textContent = '0:00';
            } else {
                if (progressBar) progressBar.value = (current / duration) * 100;
                if (currentTimeSpan) currentTimeSpan.textContent = formatTime(current);
                if (durationSpan) durationSpan.textContent = formatTime(duration);
            }
        });

        if (progressBar) {
            progressBar.addEventListener('input', () => {
                const time = (progressBar.value * audioPlayer.duration) / 100;
                audioPlayer.currentTime = time;
            });
        }
    }

    // Association des boutons de contrôle (Précédent/Suivant/Aléatoire)
    if (prevButton) {
        prevButton.addEventListener('click', playPreviousSong);
    }
    if (nextButton) {
        nextButton.addEventListener('click', playNextSong);
    }
    if (shuffleButton) {
        shuffleButton.addEventListener('click', toggleShuffle); // Changer pour toggleShuffle
    }


    // Association des écouteurs pour la recherche
    if (searchInput) {
        searchInput.addEventListener('input', searchSongs);
    }

    // Association des boutons de sauvegarde/chargement
    if (savePlaylistButton) {
        savePlaylistButton.addEventListener('click', savePlaylistOnVercel);
    }
    if (loadPlaylistsButton) {
        loadPlaylistsButton.addEventListener('click', loadSavedPlaylistsFromVercel);
    }
    // if (exportCurrentPlaylistButton) { // Supprimé car l'ID n'existe pas dans le HTML fourni
    //     exportCurrentPlaylistButton.addEventListener('click', exportCurrentPlaylist);
    // }

    // Gestion des onglets
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

            button.classList.add('active');

            const targetTabContent = document.getElementById(tabId);
            if (targetTabContent) {
                targetTabContent.style.display = 'block';
            }

            if (tabId === 'current-playlist-section') {
                loadSavedPlaylistsFromVercel(); // Recharger les playlists sauvegardées quand on va sur cet onglet
            }
        });
    });

    // Activation de l'onglet "Liste des Chansons" par défaut au chargement
    const defaultTabButton = document.querySelector('.tab-button[data-tab="playlist-section"]');
    if (defaultTabButton) {
        defaultTabButton.click();
    }
});


// --- DÉBUT DU CODE CASTING ---

// Variables globales pour le casting
let currentCastSession = null;
//const audioPlayer = document.getElementById('audioPlayer'); // Récupération de votre lecteur audio
const castButton = document.getElementById('castButton'); // Le bouton Cast que nous avons ajouté

// --- 1. Initialisation du framework Cast ---
// Cette fonction est appelée par le SDK Google Cast une fois qu'il est prêt.
window['__onGCastApiAvailable'] = function(isAvailable) {
    if (isAvailable) {
        initializeCastApi();
    } else {
        console.error('Google Cast API non disponible.');
        // Vous pouvez cacher le bouton de cast si l'API n'est pas disponible du tout
        castButton.style.display = 'none';
    }
};

function initializeCastApi() {
    cast.framework.CastContext.getInstance().setOptions({
        // Utilise le récepteur média par défaut de Google.
        // Cela signifie que vous n'avez pas besoin de créer votre propre application réceptrice.
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });

    const castContext = cast.framework.CastContext.getInstance();

    // 2. Écouteurs d'événements pour l'état du Cast
    castContext.addEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (event) => {
            console.log('Cast State Changed:', event.castState);
            if (event.castState === cast.framework.CastState.NOT_CONNECTED) {
                // Pas connecté, montrer le bouton si des appareils sont disponibles
                if (castContext.getCastState() === cast.framework.CastState.NO_DEVICES_AVAILABLE) {
                    castButton.style.display = 'none'; // Aucun appareil, cacher le bouton
                } else {
                    castButton.style.display = 'inline-block'; // Appareils disponibles, montrer le bouton
                }
                castButton.classList.remove('connected'); // Retirer la classe de connexion
            } else if (event.castState === cast.framework.CastState.CONNECTED) {
                // Connecté à un appareil Cast
                castButton.style.display = 'inline-block'; // S'assurer que le bouton est visible
                castButton.classList.add('connected'); // Ajouter une classe pour le style visuel
                currentCastSession = castContext.getCurrentSession();
                console.log('Connecté à un appareil Cast ! Session:', currentCastSession);

                // Si le média était déjà en cours sur le navigateur, le lancer sur Cast
                if (!audioPlayer.paused && audioPlayer.src) {
                    loadMediaOnCast(audioPlayer.src, audioPlayer.currentTime);
                }
            } else if (event.castState === cast.framework.CastState.CONNECTING) {
                // En cours de connexion
                castButton.style.display = 'inline-block';
                castButton.classList.add('connecting'); // Vous pouvez ajouter un style pour "connecting"
            }
        }
    );

    // Écouteur d'événements pour les changements de session (début/fin de session)
    castContext.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event) => {
            if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
                console.log('Session Cast terminée.');
                currentCastSession = null;
                // Si le média était casté, reprendre la lecture sur le lecteur local
                if (!audioPlayer.src) { // Si aucune source, ne pas tenter de jouer
                    return;
                }
                // Si le lecteur était en pause AVANT le cast, il doit rester en pause.
                // Sinon, reprendre la lecture.
                if (audioPlayer.dataset.wasPlayingBeforeCast === 'true') {
                     audioPlayer.play();
                }
                delete audioPlayer.dataset.wasPlayingBeforeCast; // Nettoyer le drapeau
            } else if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
                console.log('Nouvelle session Cast démarrée.');
                currentCastSession = castContext.getCurrentSession();
            }
        }
    );

    // Le SDK va automatiquement transformer l'élément avec l'ID 'castButton'
    // en un véritable bouton Cast. Nous devons juste nous assurer qu'il est là.
    // L'icône est gérée par le SDK par défaut.
}

// 3. Fonction pour charger et lire le média sur l'appareil Cast
function loadMediaOnCast(mediaUrl, startTime = 0) {
    if (!currentCastSession) {
        console.error('Pas de session Cast active pour charger le média.');
        return;
    }

    if (!mediaUrl) {
        console.error('URL du média vide, impossible de caster.');
        return;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(mediaUrl, 'audio/mpeg');
    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    request.autoplay = true; // Lire automatiquement sur l'appareil Cast
    request.currentTime = startTime; // Démarrer à la position actuelle du lecteur local

    currentCastSession.loadMedia(request).then(
        function() {
            console.log('Média chargé et en cours de lecture sur Cast !');
            // Mettre en pause la lecture sur le lecteur local
            // et marquer qu'il était en lecture avant le cast
            if (!audioPlayer.paused) {
                audioPlayer.dataset.wasPlayingBeforeCast = 'true';
                audioPlayer.pause();
            } else {
                 audioPlayer.dataset.wasPlayingBeforeCast = 'false';
            }
        },
        function(errorCode) {
            console.error('Erreur lors du chargement du média sur Cast:', errorCode);
            // Si erreur, on peut vouloir reprendre la lecture localement
            if (audioPlayer.dataset.wasPlayingBeforeCast === 'true') {
                 audioPlayer.play();
            }
            delete audioPlayer.dataset.wasPlayingBeforeCast;
        }
    );
}

// 4. Intégrer la logique Cast avec vos contrôles existants
// Quand votre lecteur audio HTML5 commence à jouer...
audioPlayer.addEventListener('play', function() {
    // Si une session Cast est active ET qu'aucun média n'est déjà en cours sur Cast (ou que c'est un nouveau média)
    // On lance le média sur Cast.
    if (currentCastSession && currentCastSession.getMediaSession() === null || 
        (currentCastSession && currentCastSession.getMediaSession() && currentCastSession.getMediaSession().media.contentId !== audioPlayer.src)
    ) {
        loadMediaOnCast(audioPlayer.src, audioPlayer.currentTime);
    } else if (currentCastSession && currentCastSession.getMediaSession()) {
        // Si un média est déjà en cours sur Cast, commander la lecture/reprise via Cast
        currentCastSession.getMediaSession().play();
        // Mettre en pause le lecteur local pour éviter la double lecture
        audioPlayer.pause();
    }
    // else: pas de session Cast, le lecteur HTML5 continue à jouer normalement
});

// Quand votre lecteur audio HTML5 est mis en pause...
audioPlayer.addEventListener('pause', function() {
    if (currentCastSession && currentCastSession.getMediaSession()) {
        // Si un média est en cours sur Cast, commander la pause via Cast
        currentCastSession.getMediaSession().pause();
    }
});

// Quand la source de votre lecteur change (par exemple, chanson suivante/précédente)
// Vous devrez vous assurer que votre logique de "nextButton" et "prevButton"
// met à jour `audioPlayer.src` et `audioPlayer.load()`.
// Cet écouteur s'assurera que si la source change pendant le casting,
// le nouveau média soit envoyé au Chromecast.
audioPlayer.addEventListener('loadeddata', function() {
    if (currentCastSession) {
        // Si un nouveau morceau est chargé et que nous sommes en session Cast,
        // nous voulons que le nouveau morceau soit casté.
        // On vérifie si le média actuellement casté est différent de la nouvelle source.
        if (currentCastSession.getMediaSession() && currentCastSession.getMediaSession().media.contentId !== audioPlayer.src) {
             loadMediaOnCast(audioPlayer.src, 0); // Recommencer à 0 pour le nouveau morceau
        }
    }
});

// --- FIN DU CODE CASTING ---