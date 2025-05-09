fetch('https://radioswebmp3.synology.me/songs.php')
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('song-list');
    const audio = document.getElementById('player');
    list.innerHTML = '';

    data.songs.forEach(song => {
      const li = document.createElement('li');
      li.textContent = song.title;
      const btn = document.createElement('button');
      btn.textContent = '▶️ Écouter';
      btn.onclick = () => {
        audio.src = `https://radioswebmp3.synology.me/stream.php?id=${song.id}&sid=${song.sid}&token=${song.token}`;
        audio.play();
      };
      li.appendChild(btn);
      list.appendChild(li);
    });
  })
  .catch(err => {
    document.getElementById('song-list').textContent = 'Erreur de connexion à ton NAS';
    console.error(err);
  });
