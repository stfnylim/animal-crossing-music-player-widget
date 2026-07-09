const musicTracks = [
  { src: "./audio/animalcrossing-part1.mp3", length: 4995 },
  { src: "./audio/animalcrossing-part2.mp3", length: 4994 },
];

const segmentLength = 8 * 60;
const rainTrack = "q76bMs-NwRk";
const scenes = [1, 2, 3, 4, 5].map((n) => `./video-feed/bg_${n}.gif`);

let rainPlayer;
let ytReady = false;
let rainReady = false;
let isPlaying = false;
let rainEnabled = false;
let pendingRain = false;
let currentMusicSrc = "";
let currentSegmentStart = 0;
let segmentTimer = 0;

const feedback = document.getElementById("feedback");
const volume = document.getElementById("range");
const feed = document.getElementById("feed");
const musicAudio = new Audio();
musicAudio.preload = "metadata";

function setFeedback(text) {
  if (feedback) feedback.textContent = text;
}

window.onYouTubeIframeAPIReady = () => {
  ytReady = true;
  rainPlayer = new YT.Player("rain-player", {
    height: "1",
    width: "1",
    videoId: rainTrack,
    host: "https://www.youtube-nocookie.com",
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      playsinline: 1,
      rel: 0,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        rainReady = true;
        applyVolume();
        if (pendingRain) {
          pendingRain = false;
          toggleRain();
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED && rainEnabled) {
          rainPlayer.seekTo(0, true);
          rainPlayer.playVideo();
        }
      },
    },
  });
};

function loadYouTubeApi(silent = false) {
  if (ytReady || window.YT?.Player) return;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  if (!silent) setFeedback("Loading player...");
}

function getCurrentTrack() {
  return currentMusicSrc || musicTracks[0].src;
}

function getMusicCandidates() {
  return musicTracks;
}

function getSafeMusicCandidates() {
  return musicTracks;
}

function getRandomSegment(track) {
  const maxStart = Math.max(0, track.length - segmentLength);
  const segmentCount = Math.max(1, Math.floor(maxStart / segmentLength) + 1);
  const unavailableCurrentSegment =
    track.src !== currentMusicSrc || segmentCount < 2
      ? -1
      : Math.floor(currentSegmentStart / segmentLength);
  const options = Array.from({ length: segmentCount }, (_, index) => index).filter(
    (index) => index !== unavailableCurrentSegment
  );
  const segmentIndex = options[Math.floor(Math.random() * options.length)] ?? 0;
  return segmentIndex * segmentLength;
}

function startMusicTrack(track, statusText, startSeconds = 0) {
  currentMusicSrc = track.src;
  currentSegmentStart = startSeconds;
  clearTimeout(segmentTimer);
  if (musicAudio.src !== new URL(track.src, window.location.href).href) {
    musicAudio.src = track.src;
  }
  musicAudio.currentTime = startSeconds;
  applyVolume();
  isPlaying = true;
  setFeedback(statusText);
  musicAudio
    .play()
    .then(() => {
      setFeedback(statusText);
      scheduleSegmentEnd(track, startSeconds);
    })
    .catch(() => {
      isPlaying = false;
      setFeedback("Press Play again to start audio.");
    });
}

function shuffleMusicTrack() {
  const candidates = getSafeMusicCandidates();
  const options = candidates.filter((track) => track.src !== currentMusicSrc);
  const pool = options.length > 0 ? options : candidates;
  const nextTrack = pool[Math.floor(Math.random() * pool.length)];

  if (!nextTrack) {
    setFeedback("No available music tracks.");
    return;
  }

  startMusicTrack(nextTrack, "Shuffled music segment...", getRandomSegment(nextTrack));
}

function scheduleSegmentEnd(track, startSeconds) {
  const secondsLeft = Math.max(
    1,
    Math.min(segmentLength, track.length - startSeconds)
  );
  segmentTimer = setTimeout(() => {
    if (isPlaying) shuffleMusicTrack();
  }, secondsLeft * 1000);
}

function playMusic(forceReload = false) {
  const track = currentMusicSrc
    ? musicTracks.find((candidate) => candidate.src === currentMusicSrc)
    : getMusicCandidates()[0];
  if (!track) {
    setFeedback("No available music tracks.");
    return;
  }

  if (forceReload || currentMusicSrc !== track.src) {
    startMusicTrack(track, "Starting music segment...", getRandomSegment(track));
    return;
  }

  clearTimeout(segmentTimer);
  applyVolume();
  isPlaying = true;
  setFeedback("Starting music...");
  musicAudio.play().then(() => scheduleSegmentEnd(track, musicAudio.currentTime));
}

function pauseAll() {
  musicAudio.pause();
  clearTimeout(segmentTimer);
  if (rainReady) rainPlayer.pauseVideo();
  isPlaying = false;
  rainEnabled = false;
  setFeedback("Paused.");
}

function toggleRain() {
  if (!rainReady) {
    setFeedback("Rain player is still loading...");
    return;
  }

  rainEnabled = !rainEnabled;
  if (rainEnabled) {
    rainPlayer.loadVideoById(rainTrack);
    rainPlayer.unMute();
    applyVolume();
    rainPlayer.playVideo();
    setTimeout(() => rainPlayer.playVideo(), 250);
    setFeedback("Rain layer on.");
  } else {
    rainPlayer.pauseVideo();
    setFeedback("Rain layer off.");
  }
}

function applyVolume() {
  const value = Number(volume?.value ?? 85);
  musicAudio.volume = value / 100;
  if (rainReady) rainPlayer.setVolume(Math.round(value * 0.35));
}

function updateClock() {
  const now = new Date();
  document.getElementById("locale-date").textContent = now.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById("locale-time").textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

}

document.getElementById("play").addEventListener("click", () => {
  playMusic();
});

document.getElementById("pause").addEventListener("click", pauseAll);
document.getElementById("layerRain").addEventListener("click", () => {
  loadYouTubeApi();
  if (rainReady) toggleRain();
  else pendingRain = true;
});

document.getElementById("refresh").addEventListener("click", () => {
  const next = scenes[Math.floor(Math.random() * scenes.length)];
  feed.src = next;
  shuffleMusicTrack();
});

volume.addEventListener("input", applyVolume);

const todo = document.getElementById("todo");
document.getElementById("pulley").addEventListener("click", () => {
  todo.classList.toggle("active");
  todo.classList.toggle("trigger", !todo.classList.contains("active"));
});

const form = document.getElementById("formToAddItemsID");
const list = document.getElementById("listOfItemsID");
let tasks = JSON.parse(localStorage.getItem("nookoffice-tasks") || "[]");

function saveTasks() {
  localStorage.setItem("nookoffice-tasks", JSON.stringify(tasks));
}

function renderTasks() {
  list.innerHTML = tasks
    .map(
      (task, index) => `
        <li>
          <label>${task}</label>
          <button class="remove-task" type="button" data-index="${index}" aria-label="Remove task">✓</button>
        </li>
      `
    )
    .join("");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = form.elements.item;
  tasks.push(input.value.trim());
  input.value = "";
  saveTasks();
  renderTasks();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-task");
  if (!button) return;
  tasks.splice(Number(button.dataset.index), 1);
  saveTasks();
  renderTasks();
});

let timerId;

document.getElementById("selectTimer").addEventListener("change", (event) => {
  startTimer(Number(event.target.value));
});

function startTimer(minutes) {
  clearInterval(timerId);
  document.getElementById("progBarContainer").style.display = "block";
  const progress = document.getElementById("progressBar");
  const current = document.getElementById("current");
  const end = document.getElementById("end");
  const total = minutes * 60;
  const started = Date.now();
  end.textContent = `${String(minutes).padStart(2, "0")}:00`;
  progress.dataset.end = String(minutes);

  timerId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const remaining = Math.max(total - elapsed, 0);
    const done = Math.min((elapsed / total) * 100, 100);
    current.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(
      remaining % 60
    ).padStart(2, "0")}`;
    progress.style.width = `${done}%`;

    if (remaining <= 0) {
      clearInterval(timerId);
      document.getElementById("soundCue").play();
      setFeedback("Timer finished.");
    }
  }, 250);
}

updateClock();
renderTasks();
loadYouTubeApi(true);
setInterval(updateClock, 1000);
