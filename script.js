document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const playlistElement = document.getElementById('playlist');
  const audioPlayer = document.getElementById('audioPlayer');
  const currentPlaylistElement = document.getElementById('currentPlaylist');
  const shuffleButton = document.getElementById('shuffleButton');
  const currentSongTitleElement = document.getElementById('currentSongTitle');
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  const progressBar = document.getElementById('progressBar');
  const currentTimeDisplay = document.getElementById('currentTime');
  const durationDisplay = document.getElementById('duration');

  let allSongs = [];
  let currentPlaylist = [];
  let currentSongIndex = 0;
  let isDragging = false;

  // Fonction pour formater le temps en minutes et secondes
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
    songs.forEach((song, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = song.title + (song.artist ? ` - ${song.artist}` : '');
      listItem.addEventListener('click', () => playNow(song));
      playlistElement.appendChild(listItem);
    });
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

  // Fonction pour formater le temps en minutes et secondes
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
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

  // Écouteurs d'événements pour les boutons Précédent et Suivant
  prevButton.addEventListener('click', () => {
    if (currentPlaylist.length > 0) {
      currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
      playFromPlaylist(currentSongIndex);
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentPlaylist.length > 0) {
      currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
      playFromPlaylist(currentSongIndex);
    }
  });

  loadSongs();

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
