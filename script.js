document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const playlistElement = document.getElementById('playlist');
  const audioPlayer = document.getElementById('audioPlayer');
  const currentPlaylistElement = document.getElementById('currentPlaylist');
  const shuffleButton = document.getElementById('shuffleButton');
  const currentSongTitleElement = document.getElementById('currentSongTitle');
  const progressBar = document.getElementById('progressBar');
  const currentTimeDisplay = document.getElementById('currentTime');
  const durationDisplay = document.getElementById('duration');
  const savePlaylistButton = document.getElementById('savePlaylistButton');
  const loadPlaylistsButton = document.getElementById('loadPlaylistsButton');
  const savedPlaylistsSection = document.getElementById('savedPlaylistsSection');
  const savedPlaylistsList = document.getElementById('savedPlaylistsList');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  let allSongs = [];
  let currentPlaylist = [];
  let currentSongIndex = 0;
  let isDragging = false;
  let currentPlaylistName = null; // Pour suivre le nom de la playlist actuelle
  const defaultCoverUrl = 'https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png'; // Remplacez par l'URL de votre image par défaut

  function showTab(tabId) {
    tabContents.forEach(content => content.style.display = 'none');
    tabButtons.forEach(button => button.classList.remove('active'));
    const activeTab = document.getElementById(tabId);
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    if (activeTab) activeTab.style.display = 'block';
    if (activeButton) activeButton.classList.add('active');
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const tabId = event.target.dataset.tab;
      showTab(tabId);
    });
  });

  // Formatte le temps en minutes et secondes
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }

  async function loadSongs() {
    try {
      const response = await fetch('https://radioswebmp3.synology.me/musique/audios-list.json');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      allSongs = data.map(song => ({ ...song, path: song.path.replace('.flac', '.mp3') }));
      displaySongs(allSongs);
    } catch (error) {
      console.error("Erreur lors du chargement de la liste des chansons:", error);
      playlistElement.innerHTML = "Impossible de charger la liste des chansons.";
    }
  }

  function displaySongs(songs) {
    playlistElement.innerHTML = '';
    songs.forEach((song) => {
        const listItem = document.createElement('li');
        listItem.classList.add('song-item');

        // Les lignes suivantes concernent l'affichage de la pochette
        // const coverImage = document.createElement('img');
        // coverImage.src = song.artist_image || defaultCoverUrl;
        // coverImage.classList.add('song-cover');
        // listItem.appendChild(coverImage);

        const titleArtistSpan = document.createElement('span');
        titleArtistSpan.textContent = (song.artist ? `${song.artist} - ` : '') + song.title;

        listItem.appendChild(titleArtistSpan);
        listItem.addEventListener('click', () => handleSongClick(song));
        playlistElement.appendChild(listItem);
    });
}

  function handleSongClick(song) {
    playNow(song);
    addToPlaylist(song);
  }

  function playNow(song) {
    audioPlayer.src = song.path;
    audioPlayer.play()
      .then(() => {
        document.title = `Lecture : ${song.title} - Lecteur Audio NAS`;
        currentSongTitleElement.textContent = song.title + (song.artist ? ` - ${song.artist}` : '');
      })
      .catch(error => {
        console.error("Erreur lors de la lecture du fichier MP3:", error);
        audioPlayer.src = '';
        currentSongTitleElement.textContent = '';
      });
  }

  function playFromPlaylist(index) {
    if (currentPlaylist.length > 0 && index >= 0 && index < currentPlaylist.length) {
      currentSongIndex = index;
      const song = currentPlaylist[currentSongIndex];
      audioPlayer.src = song.path;
      audioPlayer.play()
        .then(() => {
          document.title = `Lecture Playlist : ${song.title} - Lecteur Audio NAS`;
          currentSongTitleElement.textContent = song.title + (song.artist ? ` - ${song.artist}` : '');
        })
        .catch(error => {
          console.error("Erreur lors de la lecture du fichier MP3:", error);
          audioPlayer.src = '';
          currentSongTitleElement.textContent = '';
        });
    }
  }

  audioPlayer.addEventListener('ended', () => {
    if (currentPlaylist.length > 0) {
      currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
      playFromPlaylist(currentSongIndex);
    }
  });

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredSongs = allSongs.filter(song =>
      song.title.toLowerCase().includes(searchTerm) ||
      (song.artist && song.artist.toLowerCase().includes(searchTerm))
    );
    displaySongs(filteredSongs);
  });

  function addToPlaylist(song) {
    currentPlaylist.push(song);
    updateCurrentPlaylistDisplay();
  }

  function updateCurrentPlaylistDisplay() {
    currentPlaylistElement.innerHTML = '';
    currentPlaylist.forEach((song, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('song-item');

      const coverImage = document.createElement('img');
      coverImage.src = song.artist_image || defaultCoverUrl;
      coverImage.classList.add('song-cover');

      const titleArtistSpan = document.createElement('span');
      titleArtistSpan.textContent = song.title + (song.artist ? ` - ${song.artist}` : '');

      const removeButton = document.createElement('button');
      removeButton.textContent = 'Supprimer';
      removeButton.addEventListener('click', () => removeFromPlaylist(index));

      listItem.appendChild(coverImage);
      listItem.appendChild(titleArtistSpan);
      listItem.appendChild(removeButton);
      listItem.addEventListener('click', (event) => {
        if (event.target !== removeButton) {
          playFromPlaylist(index);
        }
      });
      currentPlaylistElement.appendChild(listItem);
    });
  }

  function removeFromPlaylist(index) {
    currentPlaylist.splice(index, 1);
    updateCurrentPlaylistDisplay();
    if (index === currentSongIndex && currentPlaylist.length > 0) {
      playFromPlaylist(0);
    } else if (currentPlaylist.length === 0) {
      audioPlayer.pause();
      audioPlayer.src = '';
      currentSongTitleElement.textContent = '';
      document.title = 'Lecteur Audio NAS';
    } else if (index < currentSongIndex) {
      currentSongIndex--;
    }
  }

  shuffleButton.addEventListener('click', () => {
    if (currentPlaylist.length > 0) {
      for (let i = currentPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentPlaylist[i], currentPlaylist[j]] = [currentPlaylist[j], currentPlaylist[i]];
      }
      currentSongIndex = 0;
      updateCurrentPlaylistDisplay();
      playFromPlaylist(currentSongIndex);
    }
  });

  function savePlaylist() {
    const playlistName = prompt("Nommez votre playlist :");
    if (playlistName) {
      localStorage.setItem(`playlist_${playlistName}`, JSON.stringify(currentPlaylist));
      loadSavedPlaylists(); // Mettre à jour la liste des playlists sauvegardées
    }
  }

  function deletePlaylist(playlistName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la playlist "${playlistName}" ?`)) {
      const keyToDelete = `playlist_${playlistName}`;
      localStorage.removeItem(keyToDelete);
      loadSavedPlaylists(); // Rafraîchir la liste des playlists après la suppression
      if (currentPlaylistName === playlistName) {
        currentPlaylist = [];
        updateCurrentPlaylistDisplay();
        audioPlayer.pause();
        audioPlayer.src = '';
        currentSongTitleElement.textContent = '';
        document.title = 'Lecteur Audio NAS';
        currentPlaylistName = null;
      }
      console.log(`Playlist "${playlistName}" supprimée.`);
    } else {
      console.log(`Suppression de la playlist "${playlistName}" annulée.`);
    }
  }

  function loadSavedPlaylists() {
    savedPlaylistsList.innerHTML = '';
    const savedPlaylists = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('playlist_')) {
        const playlistName = key.substring('playlist_'.length);
        savedPlaylists.push(playlistName);
      }
    }

    if (savedPlaylists.length > 0) {
      savedPlaylists.forEach(name => {
        const listItem = document.createElement('li');

        const bullet = document.createElement('span');
        bullet.classList.add('playlist-bullet');
        listItem.appendChild(bullet);

        const playlistNameSpan = document.createElement('span');
        playlistNameSpan.textContent = name;
        playlistNameSpan.addEventListener('click', () => loadPlaylist(name));
        listItem.appendChild(playlistNameSpan);

        const deleteIcon = document.createElement('span');
        deleteIcon.classList.add('delete-icon');
        deleteIcon.addEventListener('click', (event) => {
          event.stopPropagation();
          deletePlaylist(name);
        });
        listItem.appendChild(deleteIcon);

        savedPlaylistsList.appendChild(listItem);
      });
      savedPlaylistsSection.style.display = 'block';
    } else {
      savedPlaylistsSection.style.display = 'none';
    }
  }

  function loadPlaylist(playlistName) {
    const storedPlaylist = localStorage.getItem(`playlist_${playlistName}`);
    if (storedPlaylist) {
      currentPlaylist = JSON.parse(storedPlaylist);
      updateCurrentPlaylistDisplay();
      currentPlaylistName = playlistName; // Mettre à jour le nom de la playlist actuelle
    }
  }

  // Mettre à jour la barre de progression et l'affichage du temps
  function updateProgress() {
    if (audioPlayer.duration) {
      const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progressBar.value = progress;
      currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
      durationDisplay.textContent = formatTime(audioPlayer.duration);
    }
  }

  // Écouteur d'événement pour mettre à jour la progression pendant la lecture
  audioPlayer.addEventListener('timeupdate', updateProgress);

  // Écouteur d'événement pour la barre de progression (navigation)
  progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
  });

  // Empêcher la mise à jour double pendant le déplacement de la souris
  progressBar.addEventListener('mousedown', () => {
    isDragging = true;
  });

  progressBar.addEventListener('mouseup', () => {
    isDragging = false;
  });

  progressBar.addEventListener('mousemove', () => {
    if (isDragging) {
      const seekTime = (progressBar.value / 100) * audioPlayer.duration;
      currentTimeDisplay.textContent = formatTime(seekTime); // Mettre à jour l'affichage en temps réel
    }
  });

  savePlaylistButton.addEventListener('click', savePlaylist);
  loadPlaylistsButton.addEventListener('click', loadSavedPlaylists);

  loadSongs();
  loadSavedPlaylists(); // Charger les playlists sauvegardées au démarrage
  showTab('playlist-section'); // Afficher la liste des chansons par défaut
});

function exportAllPlaylists() {
  const allPlaylistsData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('playlist_')) {
      const playlistName = key.substring('playlist_'.length);
      const storedPlaylist = localStorage.getItem(key);
      if (storedPlaylist) {
        allPlaylistsData[playlistName] = JSON.parse(storedPlaylist);
      }
    }
  }

  if (Object.keys(allPlaylistsData).length > 0) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allPlaylistsData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `all_playlists.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    console.log("Toutes les playlists sauvegardées ont été exportées.");
  } else {
    console.log("Aucune playlist sauvegardée trouvée dans le localStorage.");
  }
}

// Exemple d'utilisation :
// exportAllPlaylists();
