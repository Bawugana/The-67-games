(() => {
  "use strict";

  const gameId = location.pathname.split("/").pop() || "index.html";
  if (gameId === "index.html" || gameId === "") return;

  const storageKey = `project67-keybinds:${gameId}`;
  const remappedEvents = new WeakSet();
  let bindings = loadBindings();
  let captureStep = 0;
  let pendingTarget = null;

  function loadBindings() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function saveBindings() {
    localStorage.setItem(storageKey, JSON.stringify(bindings));
  }

  function friendlyKey(key, code) {
    const names = {
      " ": "Space",
      ArrowUp: "Up Arrow",
      ArrowDown: "Down Arrow",
      ArrowLeft: "Left Arrow",
      ArrowRight: "Right Arrow",
      Shift: "Shift",
      Control: "Control",
      Alt: "Alt",
      Meta: "Command/Windows"
    };
    if (names[key]) return names[key];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    return key.length === 1 ? key.toUpperCase() : key || code;
  }

  function keyNumber(code, key) {
    if (code === "Space") return 32;
    if (code === "Enter") return 13;
    if (code === "Escape") return 27;
    if (code === "ArrowLeft") return 37;
    if (code === "ArrowUp") return 38;
    if (code === "ArrowRight") return 39;
    if (code === "ArrowDown") return 40;
    if (/^Key[A-Z]$/.test(code)) return code.charCodeAt(3);
    if (/^Digit\d$/.test(code)) return code.charCodeAt(5);
    return key && key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;
  }

  const host = document.createElement("div");
  host.id = "project67-keybinds";
  const layoutStyle = document.createElement("style");
  layoutStyle.id = "project67-topbar-space";
  layoutStyle.textContent = `html{box-sizing:border-box!important;height:100%!important}body{position:relative!important;top:0!important;transform:translateY(max(52px,1.5cm))!important;height:calc(100% - max(52px,1.5cm))!important;max-height:calc(100% - max(52px,1.5cm))!important;min-height:0!important}body>:not(script):not(style){max-height:100%!important;min-height:0!important}`;
  document.head.appendChild(layoutStyle);
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host{all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Arial,Helvetica,sans-serif;color:#f8fbff}
      *{box-sizing:border-box}
      button{font:inherit}
      #bar{position:absolute;inset:0 0 auto;height:1.5cm;min-height:52px;display:flex;align-items:stretch;justify-content:space-between;gap:8px;padding:max(4px,env(safe-area-inset-top)) max(6px,env(safe-area-inset-right)) 4px max(6px,env(safe-area-inset-left));background:#080d18eF;border-bottom:1px solid #ffffff24;box-shadow:0 8px 28px #0008;backdrop-filter:blur(16px);pointer-events:auto}
      #home{width:1.5cm;min-width:52px;display:grid;place-items:center;border:1px solid #64d2ff88;border-radius:12px;background:linear-gradient(145deg,#17233b,#0c111c);color:#fff;text-decoration:none;font-size:18px;font-weight:1000;letter-spacing:-.08em;box-shadow:inset 0 0 18px #64d2ff18}
      #home span{color:#64d2ff}
      #tools{height:100%;display:flex;align-items:stretch;gap:7px}
      #toggle,#leaderboardToggle,#reload{min-width:1.5cm;min-height:44px;border:1px solid #ffffff35;border-radius:11px;padding:0 14px;background:#121827;color:#fff;font-size:12px;font-weight:900;cursor:pointer}
      #reload{font-size:20px;padding:0;width:1.5cm;color:#ffd166}
      #toggle:hover,#toggle:focus-visible,#leaderboardToggle:hover,#leaderboardToggle:focus-visible{border-color:#64d2ff;outline:2px solid #64d2ff55}
      #reload:hover,#reload:focus-visible,#home:hover,#home:focus-visible{border-color:#ffd166;outline:2px solid #ffd16655}
      #panel,#leaderboardPanel{position:absolute;right:max(6px,env(safe-area-inset-right));top:calc(1.5cm + 8px);width:min(380px,calc(100vw - 12px));max-height:calc(100vh - 1.5cm - 46px);overflow:auto;border:1px solid #ffffff2e;border-radius:18px;padding:18px;background:#0d111bee;box-shadow:0 22px 70px #000c;backdrop-filter:blur(18px);pointer-events:auto}
      #panel[hidden],#leaderboardPanel[hidden]{display:none}
      h2{margin:0;font-size:23px;letter-spacing:-.04em}
      p{margin:8px 0 14px;color:#b9c4d5;font-size:12px;line-height:1.45}
      .add{width:100%;min-height:45px;border:0;border-radius:11px;background:linear-gradient(135deg,#64d2ff,#ffd166);color:#071018;font-weight:1000;cursor:pointer}
      .add.capture{background:linear-gradient(135deg,#ff78a5,#ffd166)}
      .row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:9px;padding:10px 11px;border:1px solid #ffffff20;border-radius:11px;background:#171c29}
      .map{font-size:13px;font-weight:800}.map b{color:#64d2ff}.map span{color:#8996a9;margin:0 6px}
      .remove{width:30px;height:30px;border:1px solid #ffffff25;border-radius:8px;background:#0c1019;color:#fff;cursor:pointer}
      .empty{padding:15px 4px 2px;text-align:center;color:#8996a9;font-size:12px}
      .footer{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:13px}
      .reset,.close{border:1px solid #ffffff25;border-radius:9px;padding:8px 10px;background:#171c29;color:#fff;font-size:11px;font-weight:800;cursor:pointer}
      .status{min-height:17px;margin:10px 0 0;color:#ffd166;font-size:11px;font-weight:800;text-align:center}
      .rank-mode{display:inline-flex;margin:2px 0 12px;padding:5px 9px;border:1px solid #64d2ff66;border-radius:999px;background:#64d2ff14;color:#8ce9ff;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
      .score-entry{display:grid;grid-template-columns:1fr 92px;gap:8px;margin:10px 0}
      .score-entry input{min-width:0;height:42px;border:1px solid #ffffff28;border-radius:10px;padding:0 11px;background:#171c29;color:#fff;font:800 13px Arial,sans-serif}
      .score-entry input:focus{border-color:#64d2ff;outline:2px solid #64d2ff33}
      #saveScore{grid-column:1/-1;min-height:44px;border:0;border-radius:11px;background:linear-gradient(135deg,#ffd166,#ff8b65);color:#14100a;font-weight:1000;cursor:pointer}
      .leader-row{display:grid;grid-template-columns:32px 1fr auto;gap:9px;align-items:center;margin-top:7px;padding:9px 10px;border:1px solid #ffffff1d;border-radius:10px;background:#171c29}
      .leader-row .place{color:#ffd166;font-weight:1000}.leader-row .name{overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:800}.leader-row .value{color:#8ce9ff;font-size:12px;font-weight:1000}
      .leader-empty{padding:17px 4px;text-align:center;color:#8996a9;font-size:12px}
      .leader-actions{display:flex;justify-content:flex-end;margin-top:12px}.leader-actions button{border:1px solid #ffffff25;border-radius:9px;padding:8px 10px;background:#171c29;color:#fff;font-size:11px;font-weight:800;cursor:pointer}
      #fps{position:absolute;left:50%;bottom:max(5px,env(safe-area-inset-bottom));transform:translateX(-50%);min-width:78px;padding:5px 10px;border:1px solid #ffffff27;border-radius:999px;background:#080d18df;color:#75f0a7;font:800 11px/1 Arial,Helvetica,sans-serif;text-align:center;box-shadow:0 5px 20px #0008;pointer-events:none}
      @media(max-width:520px){#bar{gap:5px}#toggle,#leaderboardToggle{padding:0 9px;font-size:10px}#panel,#leaderboardPanel{top:calc(1.5cm + 5px)}#fps{bottom:max(3px,env(safe-area-inset-bottom))}}
    </style>
    <nav id="bar" aria-label="Arcade navigation">
      <a id="home" href="index.html" aria-label="Return to Project 67 Arcade home">6<span>7</span></a>
      <div id="tools"><button id="reload" type="button" aria-label="Reload game" title="Reload game">↻</button><button id="leaderboardToggle" type="button" aria-expanded="false">🏆 Scores</button><button id="toggle" type="button" aria-expanded="false">⌨ Controls</button></div>
    </nav>
    <section id="panel" hidden aria-label="Custom keybinds">
      <h2>Custom keybinds</h2>
      <p>Choose a game key, then press the new key you want to use. Bindings save separately for every game.</p>
      <button class="add" id="add" type="button">+ Add keybind</button>
      <div class="status" id="status"></div>
      <div id="list"></div>
      <div class="footer"><button class="reset" id="reset" type="button">Reset this game</button><button class="close" id="close" type="button">Done</button></div>
    </section>
    <section id="leaderboardPanel" hidden aria-label="Game leaderboard">
      <h2>Leaderboard</h2>
      <p id="leaderGame"></p>
      <div class="rank-mode" id="rankMode"></div>
      <div class="score-entry">
        <input id="playerName" maxlength="18" autocomplete="nickname" aria-label="Player name" placeholder="Player name">
        <input id="scoreValue" type="number" inputmode="numeric" min="0" aria-label="Score" placeholder="Score">
        <button id="saveScore" type="button">SAVE SCORE</button>
      </div>
      <div class="status" id="leaderStatus"></div>
      <div id="leaderList"></div>
      <div class="leader-actions"><button id="clearScores" type="button">Clear this leaderboard</button></div>
    </section>
    <output id="fps" aria-label="Frames per second">FPS --</output>`;
  document.documentElement.appendChild(host);

  const toggle = shadow.querySelector("#toggle");
  const panel = shadow.querySelector("#panel");
  const add = shadow.querySelector("#add");
  const status = shadow.querySelector("#status");
  const list = shadow.querySelector("#list");
  const leaderboardToggle = shadow.querySelector("#leaderboardToggle");
  const leaderboardPanel = shadow.querySelector("#leaderboardPanel");
  const playerName = shadow.querySelector("#playerName");
  const scoreValue = shadow.querySelector("#scoreValue");
  const leaderStatus = shadow.querySelector("#leaderStatus");
  const leaderList = shadow.querySelector("#leaderList");

  const lowerScoreWins = new Set(["slide_nine.html", "tic_tac_67.html"]);
  const scoreMode = lowerScoreWins.has(gameId) ? "low" : "high";
  const leaderboardKey = `project67-leaderboard:${gameId}`;
  const scoreSelectors = {
    "geometry_bash.html": "#coins",
    "moon_mart_mayhem.html": "#coins",
    "rivals_loadout_trainer.html": "#statKills",
    "swipe_the_crown.html": "#resultScore",
    "stupid_card_battle.html": "#best",
    "the_strongest_duo.html": "#round"
  };

  function numberFromText(value) {
    const match = String(value || "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function readLiveScore() {
    if (gameId === "aim_3d_trainer.html") {
      const match = document.querySelector("#hud")?.textContent.match(/Score:\s*(\d+)/i);
      return match ? Number(match[1]) : null;
    }
    if (gameId === "rift_67.html") {
      const match = document.querySelector("#menu .kicker")?.textContent.match(/(\d+)\s+SCORE/i);
      return match ? Number(match[1]) : null;
    }
    const selector = scoreSelectors[gameId] || "#score";
    return numberFromText(document.querySelector(selector)?.textContent);
  }

  function loadScores() {
    try {
      const scores = JSON.parse(localStorage.getItem(leaderboardKey) || "[]");
      return Array.isArray(scores) ? scores : [];
    } catch {
      return [];
    }
  }

  function sortedScores(scores) {
    return scores.sort((a, b) => scoreMode === "low" ? a.score - b.score : b.score - a.score).slice(0, 10);
  }

  function renderLeaderboard() {
    const scores = sortedScores(loadScores());
    leaderList.replaceChildren();
    if (!scores.length) {
      const empty = document.createElement("div");
      empty.className = "leader-empty";
      empty.textContent = "No saved scores yet. Finish a run and save it!";
      leaderList.appendChild(empty);
      return;
    }
    scores.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      const place = document.createElement("span");
      place.className = "place";
      place.textContent = `#${index + 1}`;
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = entry.name;
      const value = document.createElement("span");
      value.className = "value";
      value.textContent = String(entry.score);
      row.append(place, name, value);
      leaderList.appendChild(row);
    });
  }

  function updateLiveScore() {
    if (!leaderboardPanel.hidden || shadow.activeElement === scoreValue) return;
    const live = readLiveScore();
    if (Number.isFinite(live)) scoreValue.value = String(Math.max(0, live));
  }

  shadow.querySelector("#leaderGame").textContent = document.title || gameId.replace(/\.html$/i, "");
  shadow.querySelector("#rankMode").textContent = scoreMode === "low" ? "Lowest score wins" : "Highest score wins";
  playerName.value = localStorage.getItem("project67-player-name") || "Player";
  updateLiveScore();
  setInterval(updateLiveScore, 600);
  renderLeaderboard();

  shadow.querySelector("#reload").addEventListener("click", () => location.reload());

  const fps = shadow.querySelector("#fps");
  let fpsFrames = 0;
  let fpsStarted = performance.now();
  function measureFps(now) {
    fpsFrames += 1;
    const elapsed = now - fpsStarted;
    if (elapsed >= 500) {
      const value = Math.round((fpsFrames * 1000) / elapsed);
      fps.textContent = `FPS ${value}`;
      fps.style.color = value >= 50 ? "#75f0a7" : value >= 30 ? "#ffd166" : "#ff718f";
      fpsFrames = 0;
      fpsStarted = now;
    }
    requestAnimationFrame(measureFps);
  }
  requestAnimationFrame(measureFps);

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) {
      leaderboardPanel.hidden = true;
      leaderboardToggle.setAttribute("aria-expanded", "false");
    }
    if (!open) cancelCapture();
  }

  function setLeaderboardOpen(open) {
    leaderboardPanel.hidden = !open;
    leaderboardToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      updateLiveScore();
      renderLeaderboard();
    }
  }

  function cancelCapture() {
    captureStep = 0;
    pendingTarget = null;
    add.classList.remove("capture");
    add.textContent = "+ Add keybind";
    status.textContent = "";
  }

  function render() {
    const entries = Object.entries(bindings);
    list.innerHTML = entries.length ? "" : '<div class="empty">No custom keys yet.</div>';
    entries.forEach(([sourceCode, binding]) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div class="map"><b>${friendlyKey(binding.sourceKey, sourceCode)}</b><span>→</span>${friendlyKey(binding.key, binding.code)}</div><button class="remove" type="button" aria-label="Remove ${sourceCode}">×</button>`;
      row.querySelector("button").addEventListener("click", () => {
        delete bindings[sourceCode];
        saveBindings();
        render();
      });
      list.appendChild(row);
    });
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  leaderboardToggle.addEventListener("click", () => setLeaderboardOpen(leaderboardPanel.hidden));
  shadow.querySelector("#saveScore").addEventListener("click", () => {
    const name = playerName.value.trim().slice(0, 18) || "Player";
    const score = Number(scoreValue.value);
    if (!Number.isFinite(score) || score < 0 || (scoreMode === "low" && score === 0)) {
      leaderStatus.textContent = "Enter a finished score first.";
      return;
    }
    localStorage.setItem("project67-player-name", name);
    const scores = loadScores();
    scores.push({ name, score, savedAt: Date.now() });
    localStorage.setItem(leaderboardKey, JSON.stringify(sortedScores(scores)));
    leaderStatus.textContent = "Score saved!";
    renderLeaderboard();
  });
  shadow.querySelector("#clearScores").addEventListener("click", () => {
    localStorage.removeItem(leaderboardKey);
    leaderStatus.textContent = "Leaderboard cleared.";
    renderLeaderboard();
  });
  shadow.querySelector("#close").addEventListener("click", () => setOpen(false));
  shadow.querySelector("#reset").addEventListener("click", () => {
    bindings = {};
    saveBindings();
    cancelCapture();
    render();
  });
  add.addEventListener("click", () => {
    captureStep = 1;
    pendingTarget = null;
    add.classList.add("capture");
    add.textContent = "Press the game’s normal key…";
    status.textContent = "Example: press Space if the game normally uses Space.";
  });

  function captureBinding(event) {
    if (!captureStep) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type !== "keydown" || event.repeat) return true;

    if (event.code === "Escape") {
      cancelCapture();
      return true;
    }

    if (captureStep === 1) {
      pendingTarget = { code: event.code, key: event.key };
      captureStep = 2;
      add.textContent = "Now press your new key…";
      status.textContent = `${friendlyKey(event.key, event.code)} will be replaced by:`;
      return true;
    }

    if (event.code === pendingTarget.code) {
      delete bindings[event.code];
    } else {
      bindings[event.code] = {
        sourceKey: event.key,
        code: pendingTarget.code,
        key: pendingTarget.key
      };
    }
    saveBindings();
    cancelCapture();
    render();
    return true;
  }

  function remap(event) {
    if (remappedEvents.has(event)) return;
    if (captureBinding(event)) return;
    const active = document.activeElement;
    if (active && (active.matches?.("input,textarea,select") || active.isContentEditable)) return;
    const binding = bindings[event.code];
    if (!binding) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const mapped = new KeyboardEvent(event.type, {
      key: binding.key,
      code: binding.code,
      location: event.location,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
      bubbles: true,
      cancelable: true
    });
    const number = keyNumber(binding.code, binding.key);
    try {
      Object.defineProperty(mapped, "keyCode", { get: () => number });
      Object.defineProperty(mapped, "which", { get: () => number });
    } catch {}
    remappedEvents.add(mapped);
    (event.target || window).dispatchEvent(mapped);
  }

  window.addEventListener("keydown", remap, true);
  window.addEventListener("keyup", remap, true);
  render();

  window.Project67Keybinds = {
    gameId,
    getBindings: () => JSON.parse(JSON.stringify(bindings)),
    open: () => setOpen(true)
  };
})();
