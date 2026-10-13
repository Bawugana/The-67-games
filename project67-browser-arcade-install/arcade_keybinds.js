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
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host{all:initial;position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483647;font-family:Arial,Helvetica,sans-serif;color:#f8fbff}
      *{box-sizing:border-box}
      button{font:inherit}
      #toggle{min-height:46px;border:1px solid #ffffff35;border-radius:999px;padding:0 16px;background:#121827eF;color:#fff;font-size:13px;font-weight:900;box-shadow:0 10px 35px #0009;cursor:pointer}
      #toggle:hover,#toggle:focus-visible{border-color:#64d2ff;outline:2px solid #64d2ff55}
      #panel{position:absolute;right:0;bottom:56px;width:min(360px,calc(100vw - 24px));max-height:min(540px,calc(100vh - 90px));overflow:auto;border:1px solid #ffffff2e;border-radius:18px;padding:18px;background:#0d111bee;box-shadow:0 22px 70px #000c;backdrop-filter:blur(18px)}
      #panel[hidden]{display:none}
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
      @media(max-width:520px){:host{right:8px;bottom:8px}#toggle{min-height:42px;padding:0 13px}#panel{right:0;bottom:51px}}
    </style>
    <button id="toggle" type="button" aria-expanded="false">⌨ Controls</button>
    <section id="panel" hidden aria-label="Custom keybinds">
      <h2>Custom keybinds</h2>
      <p>Choose a game key, then press the new key you want to use. Bindings save separately for every game.</p>
      <button class="add" id="add" type="button">+ Add keybind</button>
      <div class="status" id="status"></div>
      <div id="list"></div>
      <div class="footer"><button class="reset" id="reset" type="button">Reset this game</button><button class="close" id="close" type="button">Done</button></div>
    </section>`;
  document.documentElement.appendChild(host);

  const toggle = shadow.querySelector("#toggle");
  const panel = shadow.querySelector("#panel");
  const add = shadow.querySelector("#add");
  const status = shadow.querySelector("#status");
  const list = shadow.querySelector("#list");

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (!open) cancelCapture();
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
