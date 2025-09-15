// Déclarations des variables globales
const audioPlayer = document.getElementById('audioPlayer');
const playlistElement = document.getElementById('playlist');
const currentPlaylistElement = document.getElementById('currentPlaylist');
const currentSongTitleElement = document.getElementById('currentSongTitle');
const searchInput = document.getElementById('searchInput');
const shuffleButton = document.getElementById('shuffleButton');
const savePlaylistButton = document.getElementById('savePlaylistButton');
const loadPlaylistsButton = document.getElementById('loadPlaylistsButton');
const savedPlaylistsSection = document.getElementById('savedPlaylistsSection');
const savedPlaylistsList = document.getElementById('savedPlaylistsList');
const progressBar = document.getElementById('progressBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');

let allSongs = [];
let currentPlaylist = [];
let currentSongIndex = -1;
let currentPlaylistName = null;
let isShuffleMode = false;

// --- Fonctions de base du lecteur audio et de la gestion locale ---
//https://raw.githubusercontent.com/mikefri/RadiosWebMP3/main/public/audio_list.json
//https://mikefri.github.io/ma-playlist/audios-list.json

async function loadSongs() {
    try {
        const response = await fetch('https://mikefri.github.io/ma-playlist/audios-list.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - Échec du chargement de audios-list.json`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            allSongs = data;
        } else {
            console.error("La structure du JSON n'est pas un tableau direct:", data);
            alert("Erreur: La liste des chansons n'est pas au format attendu (tableau).");
            return;
        }
        displayAllSongs();
    } catch (error) {
        console.error('Erreur lors du chargement des chansons:', error);
        alert('Impossible de charger la liste des chansons depuis git. Vérifiez l\'URL et votre réseau.');
    }
}

function displayAllSongs() {
    if (!playlistElement) return;
    playlistElement.innerHTML = '';
    if (!Array.isArray(allSongs) || allSongs.length === 0) {
        playlistElement.innerHTML = '<li class="empty-list">Aucune chanson à afficher.</li>';
        return;
    }
    allSongs.forEach((song, index) => {
        const listItem = document.createElement('li');
        const title = song.title || 'Titre inconnu';
        const artist = song.artist || 'Artiste inconnu';
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

function addSongToCurrentPlaylist(song) {
    currentPlaylist.push(song);
    updateCurrentPlaylistDisplay();
}

// ✅ MODIFIÉ : Affiche la playlist avec le titre cliquable et les flèches
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

        let moveIcons = '';
        if (index > 0) {
            moveIcons += `<i class="fas fa-arrow-up move-up-icon" data-playlist-index="${index}" title="Monter la chanson"></i>`;
        }
        if (index < currentPlaylist.length - 1) {
            moveIcons += `<i class="fas fa-arrow-down move-down-icon" data-playlist-index="${index}" title="Descendre la chanson"></i>`;
        }

        listItem.innerHTML = `
            <span class="song-title-artist" data-playlist-index="${index}" title="Jouer cette chanson">${title} - ${artist}</span>
            <div class="list-item-icons">
                ${moveIcons}
                <i class="fas fa-trash delete-song-icon" data-playlist-index="${index}" title="Supprimer de la playlist"></i>
            </div>
        `;
        
        if (index === currentSongIndex) {
            listItem.classList.add('current-song-playing');
        }
        currentPlaylistElement.appendChild(listItem);
    });

    const playingElement = currentPlaylistElement.querySelector('.current-song-playing');
    if (playingElement) {
        playingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


function playSong(song, indexInCurrentPlaylist) {
    if (!song || !song.path) return;
    
    const previouslyPlaying = currentPlaylistElement.querySelector('.current-song-playing');
    if (previouslyPlaying) {
        previouslyPlaying.classList.remove('current-song-playing');
    }

    audioPlayer.src = song.path;
    currentSongIndex = indexInCurrentPlaylist;
    
    const newPlayingElement = currentPlaylistElement.children[currentSongIndex];
    if (newPlayingElement) {
        newPlayingElement.classList.add('current-song-playing');
        newPlayingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (currentSongTitleElement) currentSongTitleElement.textContent = `${song.title || 'Titre inconnu'} - ${song.artist || 'Artiste inconnu'}`;
    document.title = `${song.title || 'Titre inconnu'} - ${song.artist || 'Artiste inconnu'}`;
    audioPlayer.play();
}

function playNextSong() {
    if (currentPlaylist.length === 0) return;
    if (isShuffleMode) {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * currentPlaylist.length); }
        while (newIndex === currentSongIndex && currentPlaylist.length > 1);
        currentSongIndex = newIndex;
    } else {
        currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    }
    playSong(currentPlaylist[currentSongIndex], currentSongIndex);
}

function playPreviousSong() {
    if (currentPlaylist.length === 0) return;
    if (isShuffleMode) {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * currentPlaylist.length); }
        while (newIndex === currentSongIndex && currentPlaylist.length > 1);
        currentSongIndex = newIndex;
    } else {
        currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    }
    playSong(currentPlaylist[currentSongIndex], currentSongIndex);
}

// Fonctions pour monter/descendre les chansons
function moveSongUp(index) {
    if (index > 0) {
        [currentPlaylist[index], currentPlaylist[index - 1]] = [currentPlaylist[index - 1], currentPlaylist[index]];
        if (currentSongIndex === index) {
            currentSongIndex--;
        } else if (currentSongIndex === index - 1) {
            currentSongIndex++;
        }
        updateCurrentPlaylistDisplay();
    }
}

function moveSongDown(index) {
    if (index < currentPlaylist.length - 1) {
        [currentPlaylist[index], currentPlaylist[index + 1]] = [currentPlaylist[index + 1], currentPlaylist[index]];
        if (currentSongIndex === index) {
            currentSongIndex++;
        } else if (currentSongIndex === index + 1) {
            currentSongIndex--;
        }
        updateCurrentPlaylistDisplay();
    }
}

function toggleShuffle() {
    isShuffleMode = !isShuffleMode;
    if (shuffleButton) {
        shuffleButton.classList.toggle('active', isShuffleMode);
    }
}

function searchSongs() {
    const searchTerm = searchInput.value.toLowerCase();
    playlistElement.innerHTML = '';
    if (!Array.isArray(allSongs) || allSongs.length === 0) return;

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

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// --- Fonctions de gestion des playlists avec Vercel/Neon ---

async function savePlaylistOnVercel() {
    if (currentPlaylist.length === 0) {
        alert("Votre playlist actuelle est vide.");
        return;
    }
    const playlistName = prompt("Nommez votre playlist :");
    if (playlistName) {
        try {
            const response = await fetch('/api/save-playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: playlistName, playlist: currentPlaylist }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert("Playlist sauvegardée !");
                loadSavedPlaylistsFromVercel();
            } else {
                throw new Error(result.message || `Erreur lors de la sauvegarde: ${response.status}`);
            }
        } catch (error) {
            console.error("Erreur lors de la sauvegarde :", error);
            alert("Impossible de sauvegarder la playlist. Détails : " + error.message);
        }
    }
}

async function loadSavedPlaylistsFromVercel() {
    if (!savedPlaylistsList) return;
    savedPlaylistsList.innerHTML = '';
    try {
        const response = await fetch('/api/load-playlists?action=list');
        if (!response.ok) throw new Error(`Échec du chargement : ${response.status}`);
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
            if (savedPlaylistsSection) savedPlaylistsSection.style.display = 'block';
        } else {
            if (savedPlaylistsSection) savedPlaylistsSection.style.display = 'none';
        }
    } catch (error) {
        console.error("Erreur chargement playlists:", error);
        if (savedPlaylistsSection) savedPlaylistsSection.style.display = 'none';
    }
}

async function loadPlaylistFromVercel(playlistId) {
    try {
        const response = await fetch(`/api/load-playlists?action=get&id=${playlistId}`);
        if (!response.ok) throw new Error(`Échec du chargement : ${response.status}`);
        const playlistData = await response.json();
        currentPlaylist = playlistData.playlist;
        updateCurrentPlaylistDisplay();
        currentPlaylistName = playlistData.name;
        const tabButton = document.querySelector('.tab-button[data-tab="current-playlist-section"]');
        if (tabButton) tabButton.click();
    } catch (error) {
        console.error(`Erreur chargement playlist ${playlistId}:`, error);
        alert(`Impossible de charger la playlist. Détails : ` + error.message);
    }
}

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
                    if (audioPlayer) { audioPlayer.pause(); audioPlayer.src = ''; }
                    if (currentSongTitleElement) currentSongTitleElement.textContent = 'Aucune chanson en cours';
                    document.title = 'MP3 - RadiosWeb';
                    currentPlaylistName = null;
                    currentSongIndex = -1;
                }
            } else {
                throw new Error(result.message || `Erreur suppression: ${response.status}`);
            }
        } catch (error) {
            console.error("Erreur suppression:", error);
            alert("Impossible de supprimer la playlist. Détails : " + error.message);
        }
    }
}

// --- Gestionnaire d'événements DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    loadSongs();
    loadSavedPlaylistsFromVercel();

    if (playlistElement) {
        playlistElement.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('add-to-playlist-icon')) {
                const originalIndex = parseInt(target.dataset.originalIndex);
                if (!isNaN(originalIndex) && allSongs[originalIndex]) {
                    addSongToCurrentPlaylist(allSongs[originalIndex]);
                }
            } else if (target.classList.contains('play-song-icon')) {
                const originalIndex = parseInt(target.dataset.originalIndex);
                if (!isNaN(originalIndex) && allSongs[originalIndex]) {
                    currentPlaylist = [allSongs[originalIndex]];
                    playSong(allSongs[originalIndex], 0);
                    const tabButton = document.querySelector('.tab-button[data-tab="current-playlist-section"]');
                    if (tabButton) tabButton.click();
                }
            }
        });
    }

    // ✅ MODIFIÉ : Gère les clics sur le titre, les flèches et la suppression
    if (currentPlaylistElement) {
        currentPlaylistElement.addEventListener('click', (event) => {
            const target = event.target;
            const playlistIndex = parseInt(target.dataset.playlistIndex);

            if (isNaN(playlistIndex) || playlistIndex < 0 || playlistIndex >= currentPlaylist.length) return;

            if (target.classList.contains('song-title-artist')) {
                playSong(currentPlaylist[playlistIndex], playlistIndex);
            } else if (target.classList.contains('delete-song-icon')) {
                currentPlaylist.splice(playlistIndex, 1);
                if (playlistIndex < currentSongIndex) {
                    currentSongIndex--;
                } else if (playlistIndex === currentSongIndex) {
                    audioPlayer.pause();
                    audioPlayer.src = '';
                    if (currentSongTitleElement) currentSongTitleElement.textContent = 'Aucune chanson en cours';
                    document.title = 'MP3 - RadiosWeb';
                    currentSongIndex = -1;
                }
                updateCurrentPlaylistDisplay();
            } else if (target.classList.contains('move-up-icon')) {
                moveSongUp(playlistIndex);
            } else if (target.classList.contains('move-down-icon')) {
                moveSongDown(playlistIndex);
            }
        });
    }
    
    if (savedPlaylistsList) {
        savedPlaylistsList.addEventListener('click', (event) => {
            const target = event.target;
            const listItem = target.closest('li');
            if (!listItem) return;

            if (target.classList.contains('load-saved-playlist-icon')) {
                const playlistId = target.dataset.playlistId;
                if (playlistId) loadPlaylistFromVercel(playlistId);
            } else if (target.classList.contains('delete-saved-playlist-icon')) {
                const playlistId = target.dataset.playlistId;
                const playlistName = target.dataset.playlistName;
                if (playlistId && playlistName) deletePlaylistOnVercel(playlistId, playlistName);
            } else if (target.classList.contains('song-title-artist')) {
                const loadIcon = listItem.querySelector('.load-saved-playlist-icon');
                if (loadIcon) {
                    const playlistId = loadIcon.dataset.playlistId;
                    if (playlistId) loadPlaylistFromVercel(playlistId);
                }
            }
        });
    }

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
                audioPlayer.currentTime = (progressBar.value * audioPlayer.duration) / 100;
            });
        }
    }
    
    if (prevButton) prevButton.addEventListener('click', playPreviousSong);
    if (nextButton) nextButton.addEventListener('click', playNextSong);
    if (shuffleButton) shuffleButton.addEventListener('click', toggleShuffle);
    if (searchInput) searchInput.addEventListener('input', searchSongs);
    if (savePlaylistButton) savePlaylistButton.addEventListener('click', savePlaylistOnVercel);
    if (loadPlaylistsButton) loadPlaylistsButton.addEventListener('click', loadSavedPlaylistsFromVercel);
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
            button.classList.add('active');
            const targetTabContent = document.getElementById(tabId);
            if (targetTabContent) targetTabContent.style.display = 'block';
            if (tabId === 'saved-playlists-section') { // Corrigé ici
                loadSavedPlaylistsFromVercel();
            }
        });
    });

    const defaultTabButton = document.querySelector('.tab-button[data-tab="playlist-section"]');
    if (defaultTabButton) defaultTabButton.click();
});


// --- DÉBUT DU CODE CASTING ---
// Ce code reste inchangé
window['__onGCastApiAvailable'] = function(isAvailable) {
    if (isAvailable) {
        initializeCastApi();
    } else {
        console.error('Google Cast API non disponible.');
        const castButton = document.getElementById('castButton');
        if(castButton) castButton.style.display = 'none';
    }
};

function initializeCastApi() {
    cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });

    const castContext = cast.framework.CastContext.getInstance();
    const castButton = document.getElementById('castButton');

    castContext.addEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (event) => {
            if (event.castState === cast.framework.CastState.NOT_CONNECTED) {
                if (castButton) castButton.classList.remove('connected');
            } else if (event.castState === cast.framework.CastState.CONNECTED) {
                if (castButton) castButton.classList.add('connected');
                currentCastSession = castContext.getCurrentSession();
                if (!audioPlayer.paused && audioPlayer.src) {
                    loadMediaOnCast(audioPlayer.src, audioPlayer.currentTime);
                }
            }
        }
    );

    castContext.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event) => {
            if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
                currentCastSession = null;
                if (audioPlayer.dataset.wasPlayingBeforeCast === 'true') {
                     audioPlayer.play();
                }
                delete audioPlayer.dataset.wasPlayingBeforeCast;
            } else if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
                currentCastSession = castContext.getCurrentSession();
            }
        }
    );
}

let currentCastSession = null;

function loadMediaOnCast(mediaUrl, startTime = 0) {
    if (!currentCastSession || !mediaUrl) return;

    const mediaInfo = new chrome.cast.media.MediaInfo(mediaUrl, 'audio/mpeg');
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;
    request.currentTime = startTime;

    currentCastSession.loadMedia(request).then(
        () => {
            if (!audioPlayer.paused) {
                audioPlayer.dataset.wasPlayingBeforeCast = 'true';
                audioPlayer.pause();
            } else {
                audioPlayer.dataset.wasPlayingBeforeCast = 'false';
            }
        },
        (errorCode) => {
            console.error('Erreur lors du chargement du média sur Cast:', errorCode);
            if (audioPlayer.dataset.wasPlayingBeforeCast === 'true') {
                 audioPlayer.play();
            }
            delete audioPlayer.dataset.wasPlayingBeforeCast;
        }
    );
}

if (audioPlayer) {
    audioPlayer.addEventListener('play', function() {
        if (currentCastSession && (currentCastSession.getMediaSession() === null || (currentCastSession.getMediaSession() && currentCastSession.getMediaSession().media.contentId !== audioPlayer.src))) {
            loadMediaOnCast(audioPlayer.src, audioPlayer.currentTime);
        } else if (currentCastSession && currentCastSession.getMediaSession()) {
            currentCastSession.getMediaSession().play();
            audioPlayer.pause();
        }
    });

    audioPlayer.addEventListener('pause', function() {
        if (currentCastSession && currentCastSession.getMediaSession()) {
            currentCastSession.getMediaSession().pause();
        }
    });

    audioPlayer.addEventListener('loadeddata', function() {
        if (currentCastSession && currentCastSession.getMediaSession() && currentCastSession.getMediaSession().media.contentId !== audioPlayer.src) {
            loadMediaOnCast(audioPlayer.src, 0);
        }
    });
}
// --- FIN DU CODE CASTING ---
