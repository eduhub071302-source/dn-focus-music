const trackList = document.getElementById("trackList");
const trackCount = document.getElementById("trackCount");
const audio = document.getElementById("audio");

const playerCover = document.getElementById("playerCover");
const playerTitle = document.getElementById("playerTitle");
const playerCategory = document.getElementById("playerCategory");

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let tracks = [];
let currentIndex = -1;

function prettyCategory(category) {
  switch (category) {
    case "calm-piano":
      return "Calm Piano";
    case "lofi":
      return "LoFi";
    case "rain":
      return "Rain";
    case "ambient":
      return "Ambient";
    case "white-noise":
      return "White Noise";
    default:
      return category;
  }
}

function renderTracks() {
  trackList.innerHTML = "";

  tracks.forEach((track, index) => {
    const card = document.createElement("article");
    card.className = "track-card";
    if (index === currentIndex) {
      card.classList.add("active");
    }

    card.innerHTML = `
      <img class="track-cover" src="${track.cover}" alt="${track.title}">
      <div class="track-text">
        <p class="track-title">${track.title}</p>
        <p class="track-sub">${prettyCategory(track.category)}</p>
      </div>
      <button class="track-play" type="button" aria-label="Play ${track.title}">▶</button>
    `;

    card.addEventListener("click", () => {
      playTrack(index);
    });

    trackList.appendChild(card);
  });

  trackCount.textContent = `${tracks.length} tracks`;
}

function updatePlayerUI(track) {
  playerCover.src = track.cover;
  playerCover.alt = track.title;
  playerTitle.textContent = track.title;
  playerCategory.textContent = prettyCategory(track.category);
  playPauseBtn.textContent = audio.paused ? "▶" : "⏸";
}

function playTrack(index) {
  if (!tracks[index]) return;

  currentIndex = index;
  const track = tracks[index];

  audio.src = track.file;
  audio.play()
    .then(() => {
      updatePlayerUI(track);
      renderTracks();
    })
    .catch((error) => {
      console.error("Audio play failed:", error);
      playerTitle.textContent = "Playback failed";
      playerCategory.textContent = "Check file path or browser permission";
    });
}

function togglePlayPause() {
  if (currentIndex === -1 && tracks.length > 0) {
    playTrack(0);
    return;
  }

  if (audio.paused) {
    audio.play()
      .then(() => {
        if (currentIndex >= 0) {
          updatePlayerUI(tracks[currentIndex]);
        }
      })
      .catch((error) => {
        console.error("Resume failed:", error);
      });
  } else {
    audio.pause();
    if (currentIndex >= 0) {
      updatePlayerUI(tracks[currentIndex]);
    }
  }
}

function playNext() {
  if (!tracks.length) return;

  if (currentIndex === -1) {
    playTrack(0);
    return;
  }

  const nextIndex = (currentIndex + 1) % tracks.length;
  playTrack(nextIndex);
}

function playPrev() {
  if (!tracks.length) return;

  if (currentIndex === -1) {
    playTrack(0);
    return;
  }

  const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  playTrack(prevIndex);
}

playPauseBtn.addEventListener("click", togglePlayPause);
nextBtn.addEventListener("click", playNext);
prevBtn.addEventListener("click", playPrev);

audio.addEventListener("play", () => {
  if (currentIndex >= 0) {
    updatePlayerUI(tracks[currentIndex]);
    renderTracks();
  }
});

audio.addEventListener("pause", () => {
  if (currentIndex >= 0) {
    updatePlayerUI(tracks[currentIndex]);
  }
});

audio.addEventListener("ended", () => {
  playNext();
});

fetch("data/tracks.json")
  .then((response) => response.json())
  .then((data) => {
    tracks = data;
    renderTracks();
  })
  .catch((error) => {
    console.error("Failed to load tracks:", error);
    trackCount.textContent = "Could not load tracks";
    trackList.innerHTML = `
      <div class="track-card">
        <div class="track-text">
          <p class="track-title">Track list failed to load</p>
          <p class="track-sub">Check data/tracks.json and file paths.</p>
        </div>
      </div>
    `;
  });
