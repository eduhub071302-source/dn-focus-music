const trackList = document.getElementById("trackList");
const trackCount = document.getElementById("trackCount");
const heroTrackCount = document.getElementById("heroTrackCount");
const audio = document.getElementById("audio");

const playerCover = document.getElementById("playerCover");
const playerTitle = document.getElementById("playerTitle");
const playerCategory = document.getElementById("playerCategory");

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

const loadingScreen = document.getElementById("loadingScreen");
const chips = document.querySelectorAll(".chip");

const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const favoriteBtn = document.getElementById("favoriteBtn");
const installBtn = document.getElementById("installBtn");
const searchInput = document.getElementById("searchInput");
const toast = document.getElementById("toast");

let tracks = [];
let filteredTracks = [];
let currentIndex = -1;
let currentFilter = "all";
let deferredPrompt = null;
let favorites = JSON.parse(localStorage.getItem("dn-focus-favorites") || "[]");
let isShuffleOn = false;
let isRepeatOn = false;
let searchTerm = "";

function prettyCategory(category) {
  switch (category) {
    case "calm-piano": return "Calm Piano";
    case "lofi": return "LoFi";
    case "rain": return "Rain";
    case "ambient": return "Ambient";
    case "white-noise": return "White Noise";
    default: return category;
  }
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function saveFavorites() {
  localStorage.setItem("dn-focus-favorites", JSON.stringify(favorites));
}

function isFavorite(trackId) {
  return favorites.includes(trackId);
}

function toggleFavorite() {
  if (currentIndex === -1 || !tracks[currentIndex]) return;

  const trackId = tracks[currentIndex].id;

  if (isFavorite(trackId)) {
    favorites = favorites.filter((id) => id !== trackId);
    showToast("Removed from favorites");
  } else {
    favorites.push(trackId);
    showToast("Added to favorites");
  }

  saveFavorites();
  updateFavoriteButton();
  applyFilter();
}

function updateFavoriteButton() {
  if (currentIndex === -1 || !tracks[currentIndex]) {
    favoriteBtn.textContent = "♡";
    favoriteBtn.classList.remove("active");
    return;
  }

  const active = isFavorite(tracks[currentIndex].id);
  favoriteBtn.textContent = active ? "♥" : "♡";
  favoriteBtn.classList.toggle("active", active);
}

function applyFilter() {
  let result = [...tracks];

  if (currentFilter === "favorites") {
    result = result.filter((track) => isFavorite(track.id));
  } else if (currentFilter !== "all") {
    result = result.filter((track) => track.category === currentFilter);
  }

  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    result = result.filter((track) =>
      track.title.toLowerCase().includes(q) ||
      prettyCategory(track.category).toLowerCase().includes(q)
    );
  }

  filteredTracks = result;
  renderTracks();
}

function groupTracksByCategory(list) {
  const grouped = {};
  list.forEach((track) => {
    if (!grouped[track.category]) grouped[track.category] = [];
    grouped[track.category].push(track);
  });
  return grouped;
}

function renderTracks() {
  trackList.innerHTML = "";

  if (!filteredTracks.length) {
    trackList.innerHTML = `<div class="empty-state">No tracks found in this section.</div>`;
    trackCount.textContent = "0 tracks";
    return;
  }

  trackCount.textContent = `${filteredTracks.length} tracks`;

  if (currentFilter === "all" && !searchTerm.trim()) {
    const grouped = groupTracksByCategory(filteredTracks);

    Object.keys(grouped).forEach((category) => {
      const block = document.createElement("section");
      block.className = "category-block";

      const title = document.createElement("h3");
      title.className = "category-title";
      title.textContent = `${prettyCategory(category)} (${grouped[category].length})`;

      const grid = document.createElement("div");
      grid.className = "category-grid";

      grouped[category].forEach((track) => {
        grid.appendChild(createTrackCard(track));
      });

      block.appendChild(title);
      block.appendChild(grid);
      trackList.appendChild(block);
    });
  } else {
    const grid = document.createElement("div");
    grid.className = "category-grid";

    filteredTracks.forEach((track) => {
      grid.appendChild(createTrackCard(track));
    });

    trackList.appendChild(grid);
  }
}

function createTrackCard(track) {
  const realIndex = tracks.findIndex((item) => item.id === track.id);

  const card = document.createElement("article");
  card.className = "track-card";

  if (realIndex === currentIndex) {
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
    playTrack(realIndex);
  });

  return card;
}

function updatePlayerUI(track) {
  playerCover.src = track.cover;
  playerCover.alt = track.title;
  playerTitle.textContent = track.title;
  playerCategory.textContent = prettyCategory(track.category);
  playPauseBtn.textContent = audio.paused ? "▶" : "⏸";
  totalTimeEl.textContent = formatTime(audio.duration);
  updateFavoriteButton();
  shuffleBtn.classList.toggle("active", isShuffleOn);
  repeatBtn.classList.toggle("active", isRepeatOn);
}

function playTrack(index) {
  if (!tracks[index]) return;

  currentIndex = index;
  const track = tracks[index];

  audio.src = track.file;
  audio.load();

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
    audio.play().then(() => {
      if (currentIndex >= 0) updatePlayerUI(tracks[currentIndex]);
    }).catch((error) => console.error("Resume failed:", error));
  } else {
    audio.pause();
    if (currentIndex >= 0) updatePlayerUI(tracks[currentIndex]);
  }
}

function playNext() {
  if (!tracks.length) return;

  if (isShuffleOn) {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    playTrack(randomIndex);
    return;
  }

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

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((btn) => btn.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    applyFilter();
  });
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value;
  applyFilter();
});

playPauseBtn.addEventListener("click", togglePlayPause);
nextBtn.addEventListener("click", playNext);
prevBtn.addEventListener("click", playPrev);

shuffleBtn.addEventListener("click", () => {
  isShuffleOn = !isShuffleOn;
  shuffleBtn.classList.toggle("active", isShuffleOn);
  showToast(isShuffleOn ? "Shuffle on" : "Shuffle off");
});

repeatBtn.addEventListener("click", () => {
  isRepeatOn = !isRepeatOn;
  repeatBtn.classList.toggle("active", isRepeatOn);
  showToast(isRepeatOn ? "Repeat on" : "Repeat off");
});

favoriteBtn.addEventListener("click", toggleFavorite);

seekBar.addEventListener("input", () => {
  if (!isFinite(audio.duration)) return;
  const seekTo = (seekBar.value / 100) * audio.duration;
  audio.currentTime = seekTo;
});

audio.addEventListener("loadedmetadata", () => {
  totalTimeEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  currentTimeEl.textContent = formatTime(audio.currentTime);

  if (isFinite(audio.duration) && audio.duration > 0) {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
  } else {
    seekBar.value = 0;
  }
});

audio.addEventListener("play", () => {
  if (currentIndex >= 0) {
    updatePlayerUI(tracks[currentIndex]);
    renderTracks();
  }
});

audio.addEventListener("pause", () => {
  if (currentIndex >= 0) updatePlayerUI(tracks[currentIndex]);
});

audio.addEventListener("ended", () => {
  if (isRepeatOn) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  installBtn.classList.add("hidden");
  showToast("App installed");
});

fetch("data/tracks.json")
  .then((response) => response.json())
  .then((data) => {
    tracks = data;
    filteredTracks = [...tracks];
    heroTrackCount.textContent = tracks.length;
    renderTracks();

    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 650);
  })
  .catch((error) => {
    console.error("Failed to load tracks:", error);
    trackCount.textContent = "Could not load tracks";
    trackList.innerHTML = `
      <div class="empty-state">
        Track list failed to load.<br>
        Check data/tracks.json and file paths.
      </div>
    `;
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 650);
  });
