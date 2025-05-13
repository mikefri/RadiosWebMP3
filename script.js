document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const playlistElement = document.getElementById('playlist');
    const audioPlayer = document.getElementById('audioPlayer');
    const currentPlaylistElement = document.getElementById('currentPlaylist');
    const shuffleButton = document.getElementById('shuffleButton');

    let allSongs = [];
    let currentPlaylist = [];
    let currentSongIndex = 0;

    // Fonction pour récupérer la liste des chansons depuis le fichier JSON sur le NAS
    async function loadSongs() {
  try {
    const response = await fetch('/audio_list.json'); // Ajustez ce chemin si nécessaire
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    allSongs = data;
    displaySongs(allSongs);
  } catch (error) {
    console.error("Erreur lors du chargement de la liste des chansons:", error);
    playlistElement.innerHTML = "Impossible de charger la liste des chansons.";
  }
}

    // Fonction pour afficher la liste des chansons
    function displaySongs(songs) {
        playlistElement.innerHTML = '';
        songs.forEach((song, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = song.title + (song.artist ? ` - ${song.artist}` : '');
            listItem.addEventListener('click', () => playNow(song));
            playlistElement.appendChild(listItem);
        });
    }

    // Fonction pour lire une chanson immédiatement
    function playNow(song) {
        audioPlayer.src = song.path;
        audioPlayer.play();
        document.title = `Lecture : ${song.title} - Lecteur Audio NAS`;
    }

    // Fonction pour filtrer les chansons en fonction de la recherche
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredSongs = allSongs.filter(song =>
            song.title.toLowerCase().includes(searchTerm) ||
            (song.artist && song.artist.toLowerCase().includes(searchTerm))
        );
        displaySongs(filteredSongs);
    });

    // Fonction pour ajouter une chanson à la playlist
    function addToPlaylist(song) {
        currentPlaylist.push(song);
        updateCurrentPlaylistDisplay();
    }

    // Fonction pour mettre à jour l'affichage de la playlist actuelle
    function updateCurrentPlaylistDisplay() {
        currentPlaylistElement.innerHTML = '';
        currentPlaylist.forEach((song, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = song.title + (song.artist ? ` - ${song.artist}` : '');
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Supprimer';
            removeButton.addEventListener('click', () => removeFromPlaylist(index));
            listItem.appendChild(removeButton);
            listItem.addEventListener('click', (event) => {
                if (event.target !== removeButton) {
                    playFromPlaylist(index);
                }
            });
            currentPlaylistElement.appendChild(listItem);
        });
    }

    // Fonction pour supprimer une chanson de la playlist
    function removeFromPlaylist(index) {
        currentPlaylist.splice(index, 1);
        updateCurrentPlaylistDisplay();
        if (index === currentSongIndex && currentPlaylist.length > 0) {
            playFromPlaylist(0); // Jouer la chanson suivante si celle supprimée était en cours
        } else if (currentPlaylist.length === 0) {
            audioPlayer.pause();
            audioPlayer.src = '';
            document.title = 'Lecteur Audio NAS';
        } else if (index < currentSongIndex) {
            currentSongIndex--;
        }
    }

    // Fonction pour lire une chanson depuis la playlist
    function playFromPlaylist(index) {
        if (currentPlaylist.length > 0 && index >= 0 && index < currentPlaylist.length) {
            currentSongIndex = index;
            const song = currentPlaylist[currentSongIndex];
            audioPlayer.src = song.path;
            audioPlayer.play();
            document.title = `Lecture Playlist : ${song.title} - Lecteur Audio NAS`;
        }
    }

    // Écouteur d'événement pour la fin de la chanson
    audioPlayer.addEventListener('ended', () => {
        if (currentPlaylist.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
            playFromPlaylist(currentSongIndex);
        }
    });

    // Fonction pour la lecture aléatoire de la playlist
    shuffleButton.addEventListener('click', () => {
        if (currentPlaylist.length > 0) {
            // Mélanger la playlist (algorithme de Fisher-Yates)
            for (let i = currentPlaylist.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentPlaylist[i], currentPlaylist[j]] = [currentPlaylist[j], currentPlaylist[i]];
            }
            currentSongIndex = 0;
            updateCurrentPlaylistDisplay();
            playFromPlaylist(currentSongIndex);
        }
    });

    // Charger la liste des chansons au chargement de la page
    loadSongs();

    // Exemple d'ajout à la playlist (vous pouvez intégrer ceci dans la liste des chansons)
    playlistElement.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const songTitle = event.target.textContent.split(' - ')[0];
            const selectedSong = allSongs.find(song => song.title === songTitle);
            if (selectedSong) {
                addToPlaylist(selectedSong);
            }
        }
    });
});
