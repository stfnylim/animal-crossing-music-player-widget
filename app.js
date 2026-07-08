const hourlyTracks = [
  "V_9Nfwk9yWo",
  "E-GeGj9eD_Y",
  "xJMbtElUepc",
  "Otx87vJ4M1Y",
  "M2aRoiXBU2I",
  "u_VzHJW3HZc",
  "yQ7dheIA96A",
  "5CamjNTPZus",
  "EAp1h3pHa_c",
  "A6wCdDn-HzA",
  "wU7_1ZcjjPc",
  "rHHJpZQe3M0",
  "zxkVYPjhdaM",
  "_1tBg0-8bFI",
  "uzSuYtVZ764",
  "2Dkm3D4ep8w",
  "yeYxyorD-B8",
  "vc1zlXMyZow",
  "TNpieyL1Tt4",
  "iv7Xg2b1Sig",
  "xycWcS8G0EU",
  "LXhG5Lajj7I",
  "DrQSk1Pch8w",
  "QC5Y4TvkMIo",
];

const rainTrack = "q76bMs-NwRk";
const scenes = [1, 2, 3, 4, 5].map((n) => `./video-feed/bg_${n}.gif`);

let musicPlayer;
let rainPlayer;
let ytReady = false;
let playerReady = false;
let rainReady = false;
let lastHour = -1;
let isPlaying = false;
let rainEnabled = false;
let pendingPlay = false;
let pendingRain = false;

const feedback = document.getElementById("feedback");
const volume = document.getElementById("range");
const feed = document.getElementById("feed");

function setFeedback(text) {
  if (feedback) feedback.textContent = text;
}

window.onYouTubeIframeAPIReady = () => {
  ytReady = true;
  musicPlayer = new YT.Player("music-player", {
    height: "1",
    width: "1",
    videoId: getCurrentTrack(),
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
        playerReady = true;
        applyVolume();
        if (pendingPlay) {
          pendingPlay = false;
          playCurrentHour();
        } else {
          setFeedback("Press Play to start.");
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED && isPlaying) playCurrentHour(true);
      },
      onError: () => setFeedback("This hour's YouTube track is unavailable. Try refresh."),
    },
  });

  rainPlayer = new YT.Player("rain-player", {
    height: "1",
    width: "1",
    videoId: rainTrack,
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
  return hourlyTracks[new Date().getHours()];
}

function playCurrentHour(forceReload = false) {
  if (!playerReady) {
    setFeedback("Player is still loading...");
    return;
  }

  const hour = new Date().getHours();
  const track = hourlyTracks[hour];
  if (forceReload || hour !== lastHour) {
    musicPlayer.loadVideoById(track);
    lastHour = hour;
  } else {
    musicPlayer.playVideo();
  }

  isPlaying = true;
  setFeedback("Playing hourly music...");
}

function pauseAll() {
  if (playerReady) musicPlayer.pauseVideo();
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
    rainPlayer.playVideo();
    setFeedback("Rain layer on.");
  } else {
    rainPlayer.pauseVideo();
    setFeedback("Rain layer off.");
  }
}

function applyVolume() {
  const value = Number(volume?.value ?? 85);
  if (playerReady) musicPlayer.setVolume(value);
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

  if (isPlaying && now.getHours() !== lastHour && playerReady) {
    playCurrentHour(true);
  }
}

document.getElementById("play").addEventListener("click", () => {
  loadYouTubeApi();
  if (playerReady) playCurrentHour();
  else pendingPlay = true;
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
  setFeedback("Scene shuffled.");
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

const lightSwitch = document.getElementById("light-switch");
const film = document.getElementById("film");

function toggleLight() {
  film.style.display = film.style.display === "block" ? "none" : "block";
}

lightSwitch.addEventListener("click", toggleLight);
lightSwitch.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleLight();
  }
});

updateClock();
renderTasks();
loadYouTubeApi(true);
setInterval(updateClock, 1000);
