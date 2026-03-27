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
const loadingScreen = document.getElementById("loadingScreen");
const chips = document.querySelectorAll(".chip");

let tracks = [];
let filteredTracks = [];
let currentIndex = -1;
let currentFilter = "all";

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

function applyFilter() {
  if (currentFilter === "all") {
    filteredTracks = [...tracks];
  } else {
    filteredTracks = tracks.filter((track) => track.category === currentFilter);
  }

  renderTracks();
}

function groupTracksByCategory(list) {
  const grouped = {};
  list.forEach((track) => {
    if (!grouped[track.category]) {
      grouped[track.category] = [];
    }
    grouped[track.category].push(track);
  });
  return grouped;
}

function renderTracks() {
  trackList.innerHTML = "";

  if (!filteredTracks.length) {
    trackList.innerHTML = `<div class="empty-state">No tracks found in this category.</div>`;
    trackCount.textContent = "0 tracks";
    return;
  }

  trackCount.textContent = `${filteredTracks.length} tracks`;

  if (currentFilter === "all") {
    const grouped = groupTracksByCategory(filteredTracks);

    Object.keys(grouped).forEach((category) => {
      const block = document.createElement("section");
      block.className = "category-block";

      const title = document.createElement("h3");
      title.className = "category-title";
      title.textContent = prettyCategory(category);

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
        if (currentIndex >= 0) updatePlayerUI(tracks[currentIndex]);
      })
      .catch((error) => {
        console.error("Resume failed:", error);
      });
  } else {
    audio.pause();
    if (currentIndex >= 0) updatePlayerUI(tracks[currentIndex]);
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

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((btn) => btn.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    applyFilter();
  });
});

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
